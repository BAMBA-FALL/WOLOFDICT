// =============================================================================
// 🌍 WOLOFDICT - REDIS SERVICE COMPLET
// Service de cache Redis avec ioredis + patterns avancés + fallback mémoire
// =============================================================================

const logger = require('./LoggerService');

class RedisService {
  constructor() {
    this.isInitialized = false;
    this.name = 'RedisService';
    this.redis = null;
    this.subscriber = null;
    this.publisher = null;
    this.memoryCache = new Map(); // Fallback en mémoire
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000;
    this.defaultTTL = 3600; // 1 heure par défaut
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  async initialize() {
    try {
      // Charger ioredis si disponible
      try {
        const Redis = require('ioredis');
        await this.setupRedis(Redis);
      } catch (error) {
        logger.warn('ioredis non disponible, utilisation du cache mémoire:', error.message);
        this.redis = null;
      }

      // Initialiser les patterns de cache
      this.setupCachePatterns();
      
      this.isInitialized = true;
      logger.info('RedisService initialisé avec succès', {
        hasRedis: !!this.redis,
        connected: this.isConnected
      });
      
    } catch (error) {
      logger.error('Erreur initialisation RedisService:', error.message);
      throw error;
    }
  }

  async setupRedis(Redis) {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000
    };

    // Redis principal
    this.redis = new Redis(redisConfig);

    // Redis pour pub/sub
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    // Événements de connexion
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.connectionRetries = 0;
      logger.info('Redis connecté avec succès');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      this.stats.errors++;
      logger.error('Erreur Redis:', error.message);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Connexion Redis fermée');
    });

    this.redis.on('reconnecting', (delay) => {
      this.connectionRetries++;
      logger.info(`Redis reconnexion tentative ${this.connectionRetries}, délai: ${delay}ms`);
    });

    // Tentative de connexion
    try {
      await this.redis.connect();
      logger.info('Redis initialisé:', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db
      });
    } catch (error) {
      logger.warn('Impossible de se connecter à Redis, fallback mémoire activé:', error.message);
      this.redis = null;
    }
  }

  setupCachePatterns() {
    // Patterns de clés pour différents types de données
    this.patterns = {
      user: (id) => `user:${id}`,
      session: (id) => `session:${id}`,
      word: (id) => `word:${id}`,
      phrase: (id) => `phrase:${id}`,
      search: (query, filters) => `search:${this.hashQuery(query, filters)}`,
      plan: (slug) => `plan:${slug}`,
      subscription: (userId) => `subscription:${userId}`,
      rateLimit: (ip, endpoint) => `rate:${ip}:${endpoint}`,
      analytics: (type, period) => `analytics:${type}:${period}`,
      notification: (userId) => `notifications:${userId}`,
      temp: (id) => `temp:${id}`
    };

    // TTL par type de données
    this.ttls = {
      user: 1800, // 30 minutes
      session: 86400, // 24 heures
      word: 3600, // 1 heure
      phrase: 3600, // 1 heure
      search: 300, // 5 minutes
      plan: 7200, // 2 heures
      subscription: 1800, // 30 minutes
      rateLimit: 3600, // 1 heure
      analytics: 300, // 5 minutes
      notification: 600, // 10 minutes
      temp: 300 // 5 minutes
    };
  }

  // Méthodes de base
  async get(key) {
    try {
      let value;
      
      if (this.redis && this.isConnected) {
        value = await this.redis.get(key);
        if (value !== null) {
          this.stats.hits++;
          try {
            return JSON.parse(value);
          } catch {
            return value; // Retourner tel quel si pas JSON
          }
        }
      } else {
        // Fallback mémoire
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          this.stats.hits++;
          return cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis get:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.redis && this.isConnected) {
        if (ttl > 0) {
          await this.redis.setex(key, ttl, serializedValue);
        } else {
          await this.redis.set(key, serializedValue);
        }
      } else {
        // Fallback mémoire
        const expires = ttl > 0 ? Date.now() + (ttl * 1000) : Number.MAX_SAFE_INTEGER;
        this.memoryCache.set(key, { value, expires });
      }
      
      this.stats.sets++;
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis set:', error.message);
      return false;
    }
  }

  async del(key) {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      
      this.stats.deletes++;
      logger.debug(`Cache delete: ${key}`);
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis del:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.redis && this.isConnected) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        const cached = this.memoryCache.get(key);
        return cached && cached.expires > Date.now();
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis exists:', error.message);
      return false;
    }
  }

  async expire(key, ttl) {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.expire(key, ttl);
      } else {
        const cached = this.memoryCache.get(key);
        if (cached) {
          cached.expires = Date.now() + (ttl * 1000);
        }
      }
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis expire:', error.message);
      return false;
    }
  }

  async ttl(key) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.ttl(key);
      } else {
        const cached = this.memoryCache.get(key);
        if (cached) {
          const remaining = Math.max(0, cached.expires - Date.now());
          return Math.floor(remaining / 1000);
        }
        return -2; // Clé n'existe pas
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis ttl:', error.message);
      return -2;
    }
  }

  // Méthodes avancées
  async mget(keys) {
    try {
      if (this.redis && this.isConnected) {
        const values = await this.redis.mget(keys);
        return values.map(value => {
          if (value === null) return null;
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        });
      } else {
        return keys.map(key => {
          const cached = this.memoryCache.get(key);
          return (cached && cached.expires > Date.now()) ? cached.value : null;
        });
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis mget:', error.message);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (this.redis && this.isConnected) {
        const pipeline = this.redis.pipeline();
        
        for (const [key, value] of keyValuePairs) {
          const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
          if (ttl > 0) {
            pipeline.setex(key, ttl, serializedValue);
          } else {
            pipeline.set(key, serializedValue);
          }
        }
        
        await pipeline.exec();
      } else {
        const expires = ttl > 0 ? Date.now() + (ttl * 1000) : Number.MAX_SAFE_INTEGER;
        for (const [key, value] of keyValuePairs) {
          this.memoryCache.set(key, { value, expires });
        }
      }
      
      this.stats.sets += keyValuePairs.length;
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis mset:', error.message);
      return false;
    }
  }

  async increment(key, amount = 1, ttl = this.defaultTTL) {
    try {
      if (this.redis && this.isConnected) {
        const result = await this.redis.incrby(key, amount);
        if (ttl > 0) {
          await this.redis.expire(key, ttl);
        }
        return result;
      } else {
        const cached = this.memoryCache.get(key);
        const currentValue = (cached && cached.expires > Date.now()) ? cached.value : 0;
        const newValue = currentValue + amount;
        
        const expires = ttl > 0 ? Date.now() + (ttl * 1000) : Number.MAX_SAFE_INTEGER;
        this.memoryCache.set(key, { value: newValue, expires });
        
        return newValue;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur Redis increment:', error.message);
      return 0;
    }
  }

  async decrement(key, amount = 1) {
    return this.increment(key, -amount);
  }

  // Pattern cache-aside
  async remember(key, ttl, callback) {
    try {
      // Essayer de récupérer depuis le cache
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }
      
      // Exécuter le callback pour obtenir les données
      value = await callback();
      
      // Mettre en cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error('Erreur cache remember:', error.message);
      // En cas d'erreur, exécuter quand même le callback
      return await callback();
    }
  }

  // Cache spécialisé pour WolofDict
  async cacheUser(userId, userData, ttl = this.ttls.user) {
    return this.set(this.patterns.user(userId), userData, ttl);
  }

  async getCachedUser(userId) {
    return this.get(this.patterns.user(userId));
  }

  async cacheWord(wordId, wordData, ttl = this.ttls.word) {
    return this.set(this.patterns.word(wordId), wordData, ttl);
  }

  async getCachedWord(wordId) {
    return this.get(this.patterns.word(wordId));
  }

  async cacheSearchResults(query, filters, results, ttl = this.ttls.search) {
    const key = this.patterns.search(query, filters);
    return this.set(key, results, ttl);
  }

  async getCachedSearchResults(query, filters) {
    const key = this.patterns.search(query, filters);
    return this.get(key);
  }

  async cachePlan(planSlug, planData, ttl = this.ttls.plan) {
    return this.set(this.patterns.plan(planSlug), planData, ttl);
  }

  async getCachedPlan(planSlug) {
    return this.get(this.patterns.plan(planSlug));
  }

  async cacheSubscription(userId, subscriptionData, ttl = this.ttls.subscription) {
    return this.set(this.patterns.subscription(userId), subscriptionData, ttl);
  }

  async getCachedSubscription(userId) {
    return this.get(this.patterns.subscription(userId));
  }

  // Rate limiting
  async checkRateLimit(ip, endpoint, limit = 100, windowSeconds = 3600) {
    try {
      const key = this.patterns.rateLimit(ip, endpoint);
      const current = await this.increment(key, 1, windowSeconds);
      
      return {
        allowed: current <= limit,
        current,
        limit,
        resetTime: Date.now() + (windowSeconds * 1000),
        remaining: Math.max(0, limit - current)
      };
    } catch (error) {
      logger.error('Erreur rate limiting:', error.message);
      return { allowed: true, current: 0, limit, remaining: limit };
    }
  }

  // Sessions
  async createSession(sessionId, sessionData, ttl = this.ttls.session) {
    return this.set(this.patterns.session(sessionId), sessionData, ttl);
  }

  async getSession(sessionId) {
    return this.get(this.patterns.session(sessionId));
  }

  async updateSession(sessionId, sessionData, ttl = this.ttls.session) {
    return this.set(this.patterns.session(sessionId), sessionData, ttl);
  }

  async destroySession(sessionId) {
    return this.del(this.patterns.session(sessionId));
  }

  // Pub/Sub
  async publish(channel, message) {
    try {
      if (this.publisher && this.isConnected) {
        const serialized = typeof message === 'string' ? message : JSON.stringify(message);
        return await this.publisher.publish(channel, serialized);
      }
      return 0;
    } catch (error) {
      logger.error('Erreur Redis publish:', error.message);
      return 0;
    }
  }

  async subscribe(channel, callback) {
    try {
      if (this.subscriber && this.isConnected) {
        this.subscriber.subscribe(channel);
        this.subscriber.on('message', (receivedChannel, message) => {
          if (receivedChannel === channel) {
            try {
              const parsed = JSON.parse(message);
              callback(parsed);
            } catch {
              callback(message);
            }
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erreur Redis subscribe:', error.message);
      return false;
    }
  }

  // Utilitaires
  hashQuery(query, filters) {
    const crypto = require('crypto');
    const combined = JSON.stringify({ query, filters });
    return crypto.createHash('md5').update(combined).digest('hex');
  }

  async keys(pattern) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.keys(pattern);
      } else {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(this.memoryCache.keys()).filter(key => regex.test(key));
      }
    } catch (error) {
      logger.error('Erreur Redis keys:', error.message);
      return [];
    }
  }

  async flush() {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
      logger.info('Cache vidé');
      return true;
    } catch (error) {
      logger.error('Erreur flush cache:', error.message);
      return false;
    }
  }

  async flushPattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        if (this.redis && this.isConnected) {
          await this.redis.del(...keys);
        } else {
          keys.forEach(key => this.memoryCache.delete(key));
        }
        logger.debug(`${keys.length} clés supprimées pour pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      logger.error('Erreur flush pattern:', error.message);
      return 0;
    }
  }

  // Nettoyage et maintenance
  async cleanup() {
    try {
      // Nettoyer le cache mémoire des entrées expirées
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, cached] of this.memoryCache.entries()) {
        if (cached.expires <= now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.debug(`Cache mémoire nettoyé: ${cleaned} entrées expirées supprimées`);
      }
      
      // Fermer les connexions Redis si nécessaire
      if (this.redis && this.isConnected) {
        // Ne pas fermer automatiquement, laisser Redis gérer
      }
      
    } catch (error) {
      logger.error('Erreur nettoyage RedisService:', error.message);
    }
  }

  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }
      
      this.isConnected = false;
      this.isInitialized = false;
      
      logger.info('RedisService déconnecté');
    } catch (error) {
      logger.error('Erreur déconnexion Redis:', error.message);
    }
  }

  // Status et monitoring
  getStats() {
    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
      isConnected: this.isConnected,
      connectionRetries: this.connectionRetries,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  async getInfo() {
    try {
      if (this.redis && this.isConnected) {
        const info = await this.redis.info();
        const memory = await this.redis.info('memory');
        return { redis: true, info, memory };
      } else {
        return { 
          redis: false, 
          memoryCache: true,
          size: this.memoryCache.size
        };
      }
    } catch (error) {
      logger.error('Erreur Redis info:', error.message);
      return { error: error.message };
    }
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasRedis: !!this.redis,
      isConnected: this.isConnected,
      hasMemoryFallback: true,
      stats: this.getStats(),
      patterns: Object.keys(this.patterns),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new RedisService();