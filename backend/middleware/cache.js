// =============================================================================
// 💾 WOLOFDICT - CACHE MIDDLEWARE
// Middleware de cache intelligent avec Redis et mémoire
// =============================================================================

const logger = require('../services/LoggerService');
const crypto = require('crypto');

class CacheMiddleware {
  constructor() {
    this.name = 'CacheMiddleware';
    this.redis = null;
    this.memoryCache = new Map();
    this.maxMemoryItems = parseInt(process.env.CACHE_MEMORY_MAX) || 1000;
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL) || 300; // 5 minutes
    
    // Statistiques
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        const redis = require('redis');
        
        const redisConfig = process.env.REDIS_URL ? 
          { url: process.env.REDIS_URL } : 
          {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined
          };

        this.redis = redis.createClient(redisConfig);
        
        this.redis.on('error', (err) => {
          logger.warn('Redis cache error:', err.message);
          this.redis = null; // Fallback vers memory cache
        });

        await this.redis.connect();
        logger.info('Cache Redis connecté');
      } else {
        logger.info('Cache en mémoire activé (Redis non configuré)');
      }
    } catch (error) {
      logger.warn('Impossible de connecter Redis, cache mémoire utilisé:', error.message);
      this.redis = null;
    }
  }

  // =============================================================================
  // 💾 OPÉRATIONS DE CACHE
  // =============================================================================

  /**
   * Générer une clé de cache
   */
  generateCacheKey(req, customKey = null) {
    if (customKey) return customKey;

    const components = [
      req.method,
      req.originalUrl || req.url,
      req.user?.id || 'anonymous',
      req.user?.role || 'guest'
    ];

    const keyString = components.join(':');
    return `wolof:${crypto.createHash('md5').update(keyString).digest('hex')}`;
  }

  /**
   * Obtenir une valeur du cache
   */
  async get(key) {
    try {
      // Essayer Redis d'abord
      if (this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      }

      // Fallback vers cache mémoire
      if (this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        
        // Vérifier l'expiration
        if (cached.expires > Date.now()) {
          this.stats.hits++;
          return cached.data;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.stats.misses++;
      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur lecture cache:', error.message);
      return null;
    }
  }

  /**
   * Définir une valeur dans le cache
   */
  async set(key, value, ttl = null) {
    try {
      const actualTTL = ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);

      // Stocker dans Redis
      if (this.redis) {
        await this.redis.setEx(key, actualTTL, serialized);
      }

      // Stocker dans cache mémoire
      if (this.memoryCache.size >= this.maxMemoryItems) {
        // Supprimer le plus ancien
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }

      this.memoryCache.set(key, {
        data: value,
        expires: Date.now() + (actualTTL * 1000)
      });

      this.stats.sets++;

    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur écriture cache:', error.message);
    }
  }

  /**
   * Supprimer une valeur du cache
   */
  async delete(key) {
    try {
      // Supprimer de Redis
      if (this.redis) {
        await this.redis.del(key);
      }

      // Supprimer du cache mémoire
      this.memoryCache.delete(key);
      this.stats.deletes++;

    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur suppression cache:', error.message);
    }
  }

  /**
   * Nettoyer le cache expiré (mémoire uniquement)
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: ${cleaned} entrées expirées supprimées`);
    }
  }

  // =============================================================================
  // 🛡️ MIDDLEWARES DE CACHE
  // =============================================================================

  /**
   * Middleware de cache de réponse
   */
  cacheResponse(ttl = null, options = {}) {
    return async (req, res, next) => {
      try {
        // Configuration
        const {
          keyGenerator = null,
          skipCache = false,
          varyBy = [],
          onlyMethods = ['GET'],
          skipIfAuthenticated = false,
          skipIfQuery = false
        } = options;

        // Vérifications de skip
        if (skipCache || !onlyMethods.includes(req.method)) {
          return next();
        }

        if (skipIfAuthenticated && req.user) {
          return next();
        }

        if (skipIfQuery && Object.keys(req.query).length > 0) {
          return next();
        }

        // Générer la clé de cache
        let cacheKey = keyGenerator ? 
          keyGenerator(req) : 
          this.generateCacheKey(req);

        // Ajouter les variations
        if (varyBy.length > 0) {
          const variations = varyBy.map(field => req.headers[field] || req.query[field] || '').join(':');
          cacheKey += `:${crypto.createHash('md5').update(variations).digest('hex')}`;
        }

        // Vérifier le cache
        const cached = await this.get(cacheKey);
        if (cached) {
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey.substring(0, 16) + '...');
          return res.status(cached.status).json(cached.data);
        }

        // Intercepter la réponse
        const originalSend = res.send;
        const originalJson = res.json;
        let responseSent = false;

        const cacheAndSend = async (data, status) => {
          if (responseSent) return;
          responseSent = true;

          // Cache seulement les réponses de succès
          if (status >= 200 && status < 300) {
            await this.set(cacheKey, {
              data: data,
              status: status,
              timestamp: new Date().toISOString()
            }, ttl);
          }

          res.set('X-Cache', 'MISS');
          res.set('X-Cache-Key', cacheKey.substring(0, 16) + '...');
        };

        res.send = function(data) {
          cacheAndSend(data, res.statusCode);
          return originalSend.call(this, data);
        };

        res.json = function(data) {
          cacheAndSend(data, res.statusCode);
          return originalJson.call(this, data);
        };

        next();

      } catch (error) {
        logger.error('Erreur middleware cache:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware de cache conditionnel
   */
  conditionalCache(condition, ttl = null) {
    return async (req, res, next) => {
      try {
        const shouldCache = typeof condition === 'function' ? 
          condition(req, res) : 
          condition;

        if (!shouldCache) {
          return next();
        }

        return this.cacheResponse(ttl)(req, res, next);

      } catch (error) {
        logger.error('Erreur cache conditionnel:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware pour invalider le cache
   */
  invalidateCache(patterns = []) {
    return async (req, res, next) => {
      try {
        // Invalider les patterns spécifiés
        for (const pattern of patterns) {
          if (pattern.includes('*')) {
            // Pattern matching pour Redis
            if (this.redis) {
              const keys = await this.redis.keys(pattern);
              if (keys.length > 0) {
                await this.redis.del(keys);
              }
            }
            
            // Pattern matching pour cache mémoire
            for (const key of this.memoryCache.keys()) {
              if (this.matchPattern(key, pattern)) {
                this.memoryCache.delete(key);
              }
            }
          } else {
            await this.delete(pattern);
          }
        }

        // Invalider le cache de cette requête
        const cacheKey = this.generateCacheKey(req);
        await this.delete(cacheKey);

        next();

      } catch (error) {
        logger.error('Erreur invalidation cache:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware pour les tags de cache
   */
  cacheWithTags(tags = [], ttl = null) {
    return async (req, res, next) => {
      try {
        const cacheKey = this.generateCacheKey(req);
        
        // Stocker les tags associés à cette clé
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          let taggedKeys = await this.get(tagKey) || [];
          
          if (!taggedKeys.includes(cacheKey)) {
            taggedKeys.push(cacheKey);
            await this.set(tagKey, taggedKeys, ttl * 2); // Tags vivent plus longtemps
          }
        }

        return this.cacheResponse(ttl)(req, res, next);

      } catch (error) {
        logger.error('Erreur cache avec tags:', error.message);
        next();
      }
    };
  }

  /**
   * Invalider par tags
   */
  invalidateByTags(tags = []) {
    return async (req, res, next) => {
      try {
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          const taggedKeys = await this.get(tagKey) || [];
          
          // Supprimer toutes les clés associées à ce tag
          for (const key of taggedKeys) {
            await this.delete(key);
          }
          
          // Supprimer le tag lui-même
          await this.delete(tagKey);
        }

        next();

      } catch (error) {
        logger.error('Erreur invalidation par tags:', error.message);
        next();
      }
    };
  }

  // =============================================================================
  // 🔧 UTILITAIRES
  // =============================================================================

  /**
   * Matcher les patterns avec wildcards
   */
  matchPattern(str, pattern) {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(str);
  }

  /**
   * Middleware pour headers de cache HTTP
   */
  setCacheHeaders(maxAge = 300, options = {}) {
    return (req, res, next) => {
      const {
        private = false,
        noCache = false,
        noStore = false,
        mustRevalidate = false,
        staleWhileRevalidate = null,
        staleIfError = null
      } = options;

      if (noStore) {
        res.set('Cache-Control', 'no-store');
      } else if (noCache) {
        res.set('Cache-Control', 'no-cache, must-revalidate');
      } else {
        let cacheControl = private ? 'private' : 'public';
        cacheControl += `, max-age=${maxAge}`;
        
        if (mustRevalidate) {
          cacheControl += ', must-revalidate';
        }
        
        if (staleWhileRevalidate) {
          cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
        }
        
        if (staleIfError) {
          cacheControl += `, stale-if-error=${staleIfError}`;
        }

        res.set('Cache-Control', cacheControl);
      }

      next();
    };
  }

  /**
   * Warming du cache
   */
  async warmCache(routes = []) {
    logger.info('Démarrage du warming du cache...');
    
    for (const route of routes) {
      try {
        const { path, data, ttl = this.defaultTTL } = route;
        await this.set(path, data, ttl);
        logger.debug(`Cache warmed: ${path}`);
      } catch (error) {
        logger.warn(`Erreur warming cache pour ${route.path}:`, error.message);
      }
    }
    
    logger.info(`Cache warming terminé pour ${routes.length} routes`);
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryItems: this.memoryCache.size,
      redisConnected: !!this.redis,
      maxMemoryItems: this.maxMemoryItems,
      defaultTTL: this.defaultTTL
    };
  }

  /**
   * Nettoyer tout le cache
   */
  async flush() {
    try {
      if (this.redis) {
        await this.redis.flushDb();
      }
      
      this.memoryCache.clear();
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };

      logger.info('Cache complètement vidé');

    } catch (error) {
      logger.error('Erreur flush cache:', error.message);
    }
  }

  /**
   * Démarrer le nettoyage périodique
   */
  startCleanup() {
    // Nettoyer le cache mémoire toutes les 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    logger.info('Nettoyage périodique du cache démarré');
  }
}

module.exports = new CacheMiddleware();