// =============================================================================
// 🌍 WOLOFDICT - SEARCH SERVICE COMPLET ET CORRIGÉ
// Service de recherche avancée avec Elasticsearch + Fuse.js + filtres premium
// =============================================================================

const logger = require('./LoggerService');

class SearchService {
  constructor() {
    this.isInitialized = false;
    this.name = 'SearchService';
    this.elasticsearch = null;
    this.fuse = null;
    this.models = null;
    this.searchIndex = new Map(); // Index en mémoire pour fallback
    this.searchHistory = [];
  }

  async initialize() {
    try {
      // Charger Elasticsearch si disponible
      try {
        const { Client } = require('@elastic/elasticsearch');
        this.elasticsearch = new Client({
          node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          maxRetries: 3,
          requestTimeout: 60000
        });
        
        await this.elasticsearch.ping();
        logger.info('Elasticsearch connecté');
        await this.setupElasticsearchIndices();
      } catch (error) {
        logger.warn('Elasticsearch non disponible:', error.message);
        this.elasticsearch = null;
      }

      // Charger Fuse.js si disponible
      try {
        const Fuse = require('fuse.js');
        this.Fuse = Fuse;
        logger.info('Fuse.js chargé pour recherche floue');
      } catch (error) {
        logger.warn('Fuse.js non disponible');
      }

      // Charger les modèles
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans SearchService');
      } catch (error) {
        logger.warn('Modèles non disponibles, mode mock activé');
      }

      // Initialiser l'index de recherche
      await this.buildSearchIndex();
      
      this.isInitialized = true;
      logger.info('SearchService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation SearchService:', error.message);
      throw error;
    }
  }

  async setupElasticsearchIndices() {
    if (!this.elasticsearch) return;

    try {
      // Index pour les mots
      const wordsIndexExists = await this.elasticsearch.indices.exists({
        index: 'wolofdict_words'
      });

      if (!wordsIndexExists.body) {
        await this.elasticsearch.indices.create({
          index: 'wolofdict_words',
          body: {
            mappings: {
              properties: {
                wolof: { type: 'text', analyzer: 'standard' },
                french: { type: 'text', analyzer: 'french' },
                english: { type: 'text', analyzer: 'english' },
                definition: { type: 'text' },
                pronunciation: { type: 'keyword' },
                difficulty: { type: 'keyword' },
                categories: { type: 'keyword' },
                tags: { type: 'keyword' },
                isPremium: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'date' },
                popularity: { type: 'integer' }
              }
            },
            settings: {
              analysis: {
                analyzer: {
                  wolof_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding']
                  }
                }
              }
            }
          }
        });
        logger.info('Index Elasticsearch "wolofdict_words" créé');
      }

      // Index pour les phrases
      const phrasesIndexExists = await this.elasticsearch.indices.exists({
        index: 'wolofdict_phrases'
      });

      if (!phrasesIndexExists.body) {
        await this.elasticsearch.indices.create({
          index: 'wolofdict_phrases',
          body: {
            mappings: {
              properties: {
                wolof: { type: 'text', analyzer: 'standard' },
                french: { type: 'text', analyzer: 'french' },
                english: { type: 'text', analyzer: 'english' },
                context: { type: 'text' },
                type: { type: 'keyword' },
                difficulty: { type: 'keyword' },
                isPremium: { type: 'boolean' },
                createdAt: { type: 'date' }
              }
            }
          }
        });
        logger.info('Index Elasticsearch "wolofdict_phrases" créé');
      }

    } catch (error) {
      logger.error('Erreur setup indices Elasticsearch:', error.message);
    }
  }

  async buildSearchIndex() {
    try {
      if (this.models) {
        // Charger les mots pour l'index
        const words = await this.models.Word.findAll({
          include: [
            { model: this.models.Category, as: 'categories' },
            { model: this.models.Tag, as: 'tags' }
          ]
        });

        words.forEach(word => {
          this.searchIndex.set(`word_${word.id}`, {
            id: word.id,
            type: 'word',
            wolof: word.wolof,
            french: word.french,
            english: word.english,
            definition: word.definition,
            searchText: `${word.wolof} ${word.french} ${word.english || ''} ${word.definition || ''}`,
            categories: word.categories?.map(c => c.name) || [],
            tags: word.tags?.map(t => t.name) || [],
            difficulty: word.difficulty,
            isPremium: word.isPremium,
            isVerified: word.isVerified
          });
        });

        // Charger les phrases pour l'index
        const phrases = await this.models.Phrase.findAll({
          include: [
            { model: this.models.Category, as: 'categories' },
            { model: this.models.Tag, as: 'tags' }
          ]
        });

        phrases.forEach(phrase => {
          this.searchIndex.set(`phrase_${phrase.id}`, {
            id: phrase.id,
            type: 'phrase',
            wolof: phrase.wolof,
            french: phrase.french,
            english: phrase.english,
            context: phrase.context,
            searchText: `${phrase.wolof} ${phrase.french} ${phrase.english || ''} ${phrase.context || ''}`,
            categories: phrase.categories?.map(c => c.name) || [],
            tags: phrase.tags?.map(t => t.name) || [],
            difficulty: phrase.difficulty,
            isPremium: phrase.isPremium
          });
        });

        logger.info(`Index de recherche construit: ${words.length} mots, ${phrases.length} phrases`);
      }
    } catch (error) {
      logger.error('Erreur construction index:', error.message);
    }
  }

  async search(query, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        type = 'all', // 'words', 'phrases', 'all'
        userPlan = 'free',
        limit = 20,
        offset = 0,
        filters = {},
        sortBy = 'relevance',
        includePremium = false
      } = options;

      // Enregistrer la recherche
      this.logSearch(query, options);

      // Recherche avec Elasticsearch si disponible
      if (this.elasticsearch) {
        return await this.elasticsearchSearch(query, options);
      }

      // Recherche avec Fuse.js si disponible
      if (this.Fuse) {
        return await this.fuseSearch(query, options);
      }

      // Recherche basique en fallback
      return await this.basicSearch(query, options);

    } catch (error) {
      logger.error('Erreur recherche:', error.message);
      throw error;
    }
  }

  async elasticsearchSearch(query, options) {
    try {
      const { type, userPlan, limit, offset, filters, sortBy } = options;
      
      const searchQueries = [];
      
      // Construire la requête selon le type
      if (type === 'words' || type === 'all') {
        searchQueries.push({
          index: 'wolofdict_words',
          body: {
            query: this.buildElasticsearchQuery(query, filters, userPlan),
            sort: this.buildSortClause(sortBy),
            from: offset,
            size: type === 'all' ? Math.floor(limit / 2) : limit,
            highlight: {
              fields: {
                wolof: {},
                french: {},
                english: {},
                definition: {}
              }
            }
          }
        });
      }

      if (type === 'phrases' || type === 'all') {
        searchQueries.push({
          index: 'wolofdict_phrases',
          body: {
            query: this.buildElasticsearchQuery(query, filters, userPlan),
            sort: this.buildSortClause(sortBy),
            from: offset,
            size: type === 'all' ? Math.floor(limit / 2) : limit,
            highlight: {
              fields: {
                wolof: {},
                french: {},
                english: {},
                context: {}
              }
            }
          }
        });
      }

      // Exécuter les recherches
      const results = await Promise.all(
        searchQueries.map(searchQuery => this.elasticsearch.search(searchQuery))
      );

      // Formatter les résultats
      const formattedResults = this.formatElasticsearchResults(results, type);
      
      return {
        query,
        results: formattedResults.hits,
        total: formattedResults.total,
        took: formattedResults.took,
        facets: await this.buildFacets(query, filters),
        suggestions: await this.getSuggestions(query)
      };

    } catch (error) {
      logger.error('Erreur recherche Elasticsearch:', error.message);
      // Fallback vers Fuse.js ou recherche basique
      return await this.fuseSearch(query, options);
    }
  }

  buildElasticsearchQuery(query, filters, userPlan) {
    const must = [];
    const filter = [];

    // Requête principale
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query,
          fields: ['wolof^3', 'french^2', 'english', 'definition', 'context'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Filtres
    if (filters.difficulty) {
      filter.push({ term: { difficulty: filters.difficulty } });
    }

    if (filters.categories && filters.categories.length > 0) {
      filter.push({ terms: { categories: filters.categories } });
    }

    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } });
    }

    if (filters.verified !== undefined) {
      filter.push({ term: { isVerified: filters.verified } });
    }

    // Filtres premium selon le plan utilisateur
    if (userPlan === 'free') {
      filter.push({ term: { isPremium: false } });
    }

    return {
      bool: {
        must,
        filter
      }
    };
  }

  buildSortClause(sortBy) {
    switch (sortBy) {
      case 'alphabetical':
        return [{ 'wolof.keyword': { order: 'asc' } }];
      case 'newest':
        return [{ createdAt: { order: 'desc' } }];
      case 'oldest':
        return [{ createdAt: { order: 'asc' } }];
      case 'popularity':
        return [{ popularity: { order: 'desc' } }];
      default: // relevance
        return ['_score'];
    }
  }

  async fuseSearch(query, options) {
    try {
      const { type, userPlan, limit, offset, filters } = options;
      
      // Préparer les données pour Fuse.js
      let searchData = Array.from(this.searchIndex.values());
      
      // Filtrer par type
      if (type !== 'all') {
        searchData = searchData.filter(item => item.type === type.slice(0, -1)); // 'words' -> 'word'
      }

      // Filtrer par plan utilisateur
      if (userPlan === 'free') {
        searchData = searchData.filter(item => !item.isPremium);
      }

      // Appliquer les filtres
      searchData = this.applyFilters(searchData, filters);

      // Configuration Fuse.js
      const fuseOptions = {
        keys: [
          { name: 'wolof', weight: 0.4 },
          { name: 'french', weight: 0.3 },
          { name: 'english', weight: 0.2 },
          { name: 'definition', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        ignoreLocation: true,
        minMatchCharLength: 2
      };

      const fuse = new this.Fuse(searchData, fuseOptions);
      
      // Effectuer la recherche
      const fuseResults = query && query.trim() 
        ? fuse.search(query, { limit: limit + offset })
        : searchData.map((item, index) => ({ item, score: 0, refIndex: index }));

      // Pagination
      const paginatedResults = fuseResults.slice(offset, offset + limit);
      
      // Formater les résultats
      const formattedResults = paginatedResults.map(result => ({
        ...result.item,
        score: result.score || 0,
        matches: result.matches || []
      }));

      return {
        query,
        results: formattedResults,
        total: fuseResults.length,
        took: Date.now(),
        facets: await this.buildFacets(query, filters),
        suggestions: await this.getSuggestions(query)
      };

    } catch (error) {
      logger.error('Erreur recherche Fuse.js:', error.message);
      return await this.basicSearch(query, options);
    }
  }

  async basicSearch(query, options) {
    try {
      const { type, userPlan, limit, offset, filters } = options;
      
      let searchData = Array.from(this.searchIndex.values());
      
      // Filtrer par type
      if (type !== 'all') {
        searchData = searchData.filter(item => item.type === type.slice(0, -1));
      }

      // Filtrer par plan utilisateur
      if (userPlan === 'free') {
        searchData = searchData.filter(item => !item.isPremium);
      }

      // Appliquer les filtres
      searchData = this.applyFilters(searchData, filters);

      // Recherche textuelle basique
      if (query && query.trim()) {
        const searchTerms = query.toLowerCase().split(/\s+/);
        
        searchData = searchData.filter(item => {
          const searchText = item.searchText.toLowerCase();
          return searchTerms.some(term => searchText.includes(term));
        });

        // Tri par pertinence basique
        searchData.sort((a, b) => {
          const scoreA = this.calculateBasicRelevanceScore(a.searchText.toLowerCase(), query.toLowerCase());
          const scoreB = this.calculateBasicRelevanceScore(b.searchText.toLowerCase(), query.toLowerCase());
          return scoreB - scoreA;
        });
      }

      // Pagination
      const total = searchData.length;
      const paginatedResults = searchData.slice(offset, offset + limit);

      return {
        query,
        results: paginatedResults,
        total,
        took: Date.now(),
        facets: await this.buildFacets(query, filters),
        suggestions: await this.getSuggestions(query)
      };

    } catch (error) {
      logger.error('Erreur recherche basique:', error.message);
      return {
        query,
        results: [],
        total: 0,
        took: 0,
        facets: {},
        suggestions: []
      };
    }
  }

  applyFilters(data, filters) {
    let filtered = data;

    if (filters.difficulty) {
      filtered = filtered.filter(item => item.difficulty === filters.difficulty);
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(item => 
        filters.categories.some(cat => item.categories.includes(cat))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        filters.tags.some(tag => item.tags.includes(tag))
      );
    }

    if (filters.verified !== undefined) {
      filtered = filtered.filter(item => item.isVerified === filters.verified);
    }

    return filtered;
  }

  calculateBasicRelevanceScore(text, query) {
    let score = 0;
    const queryTerms = query.split(/\s+/);
    
    queryTerms.forEach(term => {
      if (text.includes(term)) {
        // Bonus si c'est un match exact au début
        if (text.startsWith(term)) score += 10;
        // Bonus si c'est un match de mot complet
        else if (text.includes(` ${term} `) || text.includes(` ${term}`) || text.includes(`${term} `)) score += 5;
        // Score de base pour toute occurrence
        else score += 1;
      }
    });

    return score;
  }

  async buildFacets(query, currentFilters) {
    try {
      const facets = {};
      
      // Construire les facettes sans les filtres actuels
      let data = Array.from(this.searchIndex.values());
      
      if (query && query.trim()) {
        const searchTerms = query.toLowerCase().split(/\s+/);
        data = data.filter(item => {
          const searchText = item.searchText.toLowerCase();
          return searchTerms.some(term => searchText.includes(term));
        });
      }

      // Facette difficulté
      const difficulties = {};
      data.forEach(item => {
        if (item.difficulty) {
          difficulties[item.difficulty] = (difficulties[item.difficulty] || 0) + 1;
        }
      });
      facets.difficulties = difficulties;

      // Facette catégories
      const categories = {};
      data.forEach(item => {
        item.categories?.forEach(cat => {
          categories[cat] = (categories[cat] || 0) + 1;
        });
      });
      facets.categories = categories;

      // Facette tags
      const tags = {};
      data.forEach(item => {
        item.tags?.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      });
      facets.tags = tags;

      // Facette type de contenu
      const types = {};
      data.forEach(item => {
        types[item.type] = (types[item.type] || 0) + 1;
      });
      facets.types = types;

      return facets;
    } catch (error) {
      logger.error('Erreur construction facettes:', error.message);
      return {};
    }
  }

  async getSuggestions(query) {
    try {
      if (!query || query.length < 2) return [];

      const suggestions = new Set();
      const queryLower = query.toLowerCase();
      
      // Rechercher des suggestions dans l'index
      Array.from(this.searchIndex.values()).forEach(item => {
        // Suggestions basées sur le début des mots
        [item.wolof, item.french, item.english].forEach(text => {
          if (text) {
            const words = text.toLowerCase().split(/\s+/);
            words.forEach(word => {
              if (word.startsWith(queryLower) && word !== queryLower) {
                suggestions.add(word);
              }
            });
          }
        });
      });

      // Limiter à 10 suggestions
      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      logger.error('Erreur génération suggestions:', error.message);
      return [];
    }
  }

  formatElasticsearchResults(results, type) {
    const allHits = [];
    let totalHits = 0;
    let maxTook = 0;

    results.forEach(result => {
      if (result.body && result.body.hits) {
        allHits.push(...result.body.hits.hits);
        totalHits += result.body.hits.total.value || result.body.hits.total;
        maxTook = Math.max(maxTook, result.body.took);
      }
    });

    // Trier par score si multiple index
    if (allHits.length > 1) {
      allHits.sort((a, b) => b._score - a._score);
    }

    return {
      hits: allHits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight
      })),
      total: totalHits,
      took: maxTook
    };
  }

  // Méthodes spécialisées
  async searchWords(query, options = {}) {
    return this.search(query, { ...options, type: 'words' });
  }

  async searchPhrases(query, options = {}) {
    return this.search(query, { ...options, type: 'phrases' });
  }

  async searchByCategory(categoryName, options = {}) {
    return this.search('', {
      ...options,
      filters: { ...options.filters, categories: [categoryName] }
    });
  }

  async searchByTag(tagName, options = {}) {
    return this.search('', {
      ...options,
      filters: { ...options.filters, tags: [tagName] }
    });
  }

  async searchByDifficulty(difficulty, options = {}) {
    return this.search('', {
      ...options,
      filters: { ...options.filters, difficulty }
    });
  }

  async getPopularSearches(limit = 10) {
    try {
      const searchCounts = {};
      
      this.searchHistory.forEach(search => {
        const query = search.query.toLowerCase().trim();
        if (query.length > 1) {
          searchCounts[query] = (searchCounts[query] || 0) + 1;
        }
      });

      return Object.entries(searchCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      logger.error('Erreur récupération recherches populaires:', error.message);
      return [];
    }
  }

  async getTrendingSearches(limit = 10, timeWindow = 24) {
    try {
      const cutoffTime = Date.now() - (timeWindow * 60 * 60 * 1000);
      const recentSearches = this.searchHistory.filter(
        search => search.timestamp > cutoffTime
      );

      const searchCounts = {};
      recentSearches.forEach(search => {
        const query = search.query.toLowerCase().trim();
        if (query.length > 1) {
          searchCounts[query] = (searchCounts[query] || 0) + 1;
        }
      });

      return Object.entries(searchCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      logger.error('Erreur récupération recherches tendance:', error.message);
      return [];
    }
  }

  logSearch(query, options) {
    try {
      const searchLog = {
        query: query || '',
        options,
        timestamp: Date.now(),
        userPlan: options.userPlan || 'free',
        resultsCount: 0 // Sera mis à jour après la recherche
      };

      this.searchHistory.push(searchLog);

      // Garder seulement les 10000 dernières recherches
      if (this.searchHistory.length > 10000) {
        this.searchHistory = this.searchHistory.slice(-10000);
      }

      logger.debug('Recherche loggée:', { query, userPlan: options.userPlan });
    } catch (error) {
      logger.error('Erreur log recherche:', error.message);
    }
  }

  async updateSearchIndex(type, id, data) {
    try {
      const key = `${type}_${id}`;
      
      if (data === null) {
        // Supprimer de l'index
        this.searchIndex.delete(key);
        
        // Supprimer d'Elasticsearch si disponible
        if (this.elasticsearch) {
          await this.elasticsearch.delete({
            index: `wolofdict_${type}s`,
            id: id
          }).catch(err => logger.debug('Document non trouvé dans ES:', err.message));
        }
      } else {
        // Mettre à jour l'index
        const searchItem = {
          id: data.id,
          type,
          wolof: data.wolof,
          french: data.french,
          english: data.english,
          definition: data.definition || data.context,
          searchText: `${data.wolof} ${data.french} ${data.english || ''} ${data.definition || data.context || ''}`,
          categories: data.categories?.map(c => c.name) || [],
          tags: data.tags?.map(t => t.name) || [],
          difficulty: data.difficulty,
          isPremium: data.isPremium,
          isVerified: data.isVerified
        };

        this.searchIndex.set(key, searchItem);

        // Mettre à jour Elasticsearch si disponible
        if (this.elasticsearch) {
          await this.elasticsearch.index({
            index: `wolofdict_${type}s`,
            id: id,
            body: searchItem
          }).catch(err => logger.debug('Erreur indexation ES:', err.message));
        }
      }

      logger.debug(`Index mis à jour: ${type} ${id}`);
    } catch (error) {
      logger.error('Erreur mise à jour index:', error.message);
    }
  }

  async rebuildIndex() {
    try {
      logger.info('Reconstruction de l\'index de recherche...');
      
      this.searchIndex.clear();
      await this.buildSearchIndex();
      
      logger.info('Index de recherche reconstruit avec succès');
      return { success: true, indexSize: this.searchIndex.size };
    } catch (error) {
      logger.error('Erreur reconstruction index:', error.message);
      throw error;
    }
  }

  // Fonctionnalités avancées
  async advancedSearch(options) {
    try {
      const {
        query = '',
        exact = false,
        fuzzy = true,
        boost = {},
        filters = {},
        aggregations = [],
        userPlan = 'free',
        limit = 20,
        offset = 0
      } = options;

      // Recherche avancée premium uniquement
      if (userPlan === 'free') {
        return await this.search(query, { ...options, limit: Math.min(limit, 10) });
      }

      if (this.elasticsearch) {
        return await this.elasticsearchAdvancedSearch(options);
      }

      // Fallback vers recherche normale
      return await this.search(query, options);
    } catch (error) {
      logger.error('Erreur recherche avancée:', error.message);
      throw error;
    }
  }

  async elasticsearchAdvancedSearch(options) {
    const {
      query,
      exact,
      fuzzy,
      boost,
      filters,
      aggregations,
      limit,
      offset
    } = options;

    const searchBody = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
          boost: 1.0
        }
      },
      highlight: {
        fields: {
          wolof: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
          french: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
          english: { pre_tags: ['<mark>'], post_tags: ['</mark>'] }
        }
      },
      from: offset,
      size: limit
    };

    // Construction de la requête
    if (query && query.trim()) {
      if (exact) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['wolof.exact^3', 'french.exact^2', 'english.exact'],
            type: 'phrase'
          }
        });
      } else {
        const fields = ['wolof^3', 'french^2', 'english'];
        
        // Appliquer les boosts personnalisés
        if (boost.wolof) fields[0] = `wolof^${boost.wolof}`;
        if (boost.french) fields[1] = `french^${boost.french}`;
        if (boost.english) fields[2] = `english^${boost.english}`;

        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: fields,
            type: 'best_fields',
            fuzziness: fuzzy ? 'AUTO' : 0
          }
        });
      }
    }

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        searchBody.query.bool.filter.push({
          terms: { [key]: value }
        });
      } else {
        searchBody.query.bool.filter.push({
          term: { [key]: value }
        });
      }
    });

    // Ajouter les agrégations
    if (aggregations.length > 0) {
      searchBody.aggs = {};
      aggregations.forEach(agg => {
        searchBody.aggs[agg.name] = {
          terms: {
            field: agg.field,
            size: agg.size || 10
          }
        };
      });
    }

    try {
      const response = await this.elasticsearch.search({
        index: 'wolofdict_*',
        body: searchBody
      });

      return {
        query,
        results: response.body.hits.hits.map(hit => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight,
          index: hit._index
        })),
        total: response.body.hits.total.value || response.body.hits.total,
        took: response.body.took,
        aggregations: response.body.aggregations || {}
      };
    } catch (error) {
      logger.error('Erreur recherche avancée Elasticsearch:', error.message);
      throw error;
    }
  }

  async searchSimilar(contentId, contentType, options = {}) {
    try {
      const { limit = 5, userPlan = 'free' } = options;

      // Récupérer le contenu de référence
      const sourceContent = this.searchIndex.get(`${contentType}_${contentId}`);
      if (!sourceContent) {
        return { results: [], total: 0 };
      }

      // Construire une requête pour trouver du contenu similaire
      const similarQuery = [
        sourceContent.wolof,
        sourceContent.french,
        sourceContent.english
      ].filter(Boolean).join(' ');

      const searchOptions = {
        type: contentType + 's',
        userPlan,
        limit: limit + 1, // +1 pour exclure le contenu source
        filters: {
          difficulty: sourceContent.difficulty
        }
      };

      const results = await this.search(similarQuery, searchOptions);
      
      // Exclure le contenu source et limiter
      const filtered = results.results
        .filter(item => item.id !== contentId)
        .slice(0, limit);

      return {
        ...results,
        results: filtered,
        total: filtered.length
      };
    } catch (error) {
      logger.error('Erreur recherche similaire:', error.message);
      return { results: [], total: 0 };
    }
  }

  async getRecommendations(userId, options = {}) {
    try {
      const { limit = 10, userPlan = 'free' } = options;

      // Pour le moment, recommandations basiques
      // TODO: Implémenter ML/IA pour recommandations personnalisées
      
      const recommendations = [];
      
      // Contenu populaire
      const popular = Array.from(this.searchIndex.values())
        .filter(item => !item.isPremium || userPlan !== 'free')
        .sort(() => Math.random() - 0.5) // Mélanger
        .slice(0, limit);

      recommendations.push(...popular);

      return {
        userId,
        recommendations,
        total: recommendations.length,
        algorithm: 'random_popular'
      };
    } catch (error) {
      logger.error('Erreur génération recommandations:', error.message);
      return { recommendations: [], total: 0 };
    }
  }

  async exportSearchResults(query, options = {}, format = 'json') {
    try {
      const { userPlan = 'free' } = options;
      
      // Export premium uniquement
      if (userPlan === 'free') {
        throw new Error('Export disponible pour les utilisateurs Premium uniquement');
      }

      const results = await this.search(query, { ...options, limit: 1000 });
      
      switch (format.toLowerCase()) {
        case 'json':
          return {
            format: 'json',
            data: JSON.stringify(results, null, 2),
            filename: `search_${Date.now()}.json`
          };
          
        case 'csv':
          const csv = this.convertToCSV(results.results);
          return {
            format: 'csv',
            data: csv,
            filename: `search_${Date.now()}.csv`
          };
          
        default:
          throw new Error('Format non supporté. Utilisez json ou csv');
      }
    } catch (error) {
      logger.error('Erreur export résultats:', error.message);
      throw error;
    }
  }

  convertToCSV(results) {
    if (!results.length) return '';

    const headers = ['id', 'type', 'wolof', 'french', 'english', 'difficulty', 'isPremium'];
    const rows = results.map(item => 
      headers.map(header => {
        const value = item[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async bulkIndex(items, type) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return { success: true, indexed: 0 };
      }

      let indexed = 0;

      // Index en mémoire
      items.forEach(item => {
        const searchItem = {
          id: item.id,
          type,
          wolof: item.wolof,
          french: item.french,
          english: item.english,
          definition: item.definition || item.context,
          searchText: `${item.wolof} ${item.french} ${item.english || ''} ${item.definition || item.context || ''}`,
          categories: item.categories?.map(c => c.name) || [],
          tags: item.tags?.map(t => t.name) || [],
          difficulty: item.difficulty,
          isPremium: item.isPremium,
          isVerified: item.isVerified
        };

        this.searchIndex.set(`${type}_${item.id}`, searchItem);
        indexed++;
      });

      // Index Elasticsearch si disponible
      if (this.elasticsearch) {
        try {
          const body = [];
          items.forEach(item => {
            body.push({
              index: {
                _index: `wolofdict_${type}s`,
                _id: item.id
              }
            });
            body.push({
              id: item.id,
              type,
              wolof: item.wolof,
              french: item.french,
              english: item.english,
              definition: item.definition || item.context,
              categories: item.categories?.map(c => c.name) || [],
              tags: item.tags?.map(t => t.name) || [],
              difficulty: item.difficulty,
              isPremium: item.isPremium,
              isVerified: item.isVerified,
              createdAt: item.createdAt
            });
          });

          await this.elasticsearch.bulk({ body });
          logger.info(`${indexed} éléments indexés dans Elasticsearch`);
        } catch (error) {
          logger.warn('Erreur indexation bulk Elasticsearch:', error.message);
        }
      }

      logger.info(`Indexation bulk terminée: ${indexed} éléments`);
      return { success: true, indexed };
    } catch (error) {
      logger.error('Erreur indexation bulk:', error.message);
      throw error;
    }
  }

  async deleteFromIndex(type, id) {
    try {
      const key = `${type}_${id}`;
      
      // Supprimer de l'index mémoire
      const deleted = this.searchIndex.delete(key);
      
      // Supprimer d'Elasticsearch si disponible
      if (this.elasticsearch) {
        try {
          await this.elasticsearch.delete({
            index: `wolofdict_${type}s`,
            id: id
          });
        } catch (error) {
          logger.debug('Document non trouvé dans ES pour suppression:', error.message);
        }
      }

      logger.debug(`Élément supprimé de l'index: ${type} ${id}`);
      return { success: true, deleted };
    } catch (error) {
      logger.error('Erreur suppression index:', error.message);
      throw error;
    }
  }

  async getSearchAnalytics(timeframe = '24h') {
    try {
      const now = Date.now();
      let cutoffTime;

      switch (timeframe) {
        case '1h':
          cutoffTime = now - (60 * 60 * 1000);
          break;
        case '24h':
          cutoffTime = now - (24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = now - (24 * 60 * 60 * 1000);
      }

      const recentSearches = this.searchHistory.filter(
        search => search.timestamp > cutoffTime
      );

      const analytics = {
        timeframe,
        totalSearches: recentSearches.length,
        uniqueUsers: new Set(recentSearches.map(s => s.options.userId).filter(Boolean)).size,
        uniqueQueries: new Set(recentSearches.map(s => s.query.toLowerCase().trim())).size,
        averageResultsPerSearch: 0,
        topQueries: {},
        searchesByPlan: { free: 0, premium: 0, pro: 0 },
        emptyResultsRate: 0,
        searchesByHour: {}
      };

      // Analyse détaillée
      let totalResults = 0;
      let emptyResults = 0;

      recentSearches.forEach(search => {
        // Comptage par plan
        const plan = search.userPlan || 'free';
        analytics.searchesByPlan[plan]++;

        // Comptage par heure
        const hour = new Date(search.timestamp).getHours();
        analytics.searchesByHour[hour] = (analytics.searchesByHour[hour] || 0) + 1;

        // Top queries
        const query = search.query.toLowerCase().trim();
        if (query.length > 0) {
          analytics.topQueries[query] = (analytics.topQueries[query] || 0) + 1;
        }

        // Résultats
        const resultCount = search.resultsCount || 0;
        totalResults += resultCount;
        if (resultCount === 0) emptyResults++;
      });

      // Calculs finaux
      if (recentSearches.length > 0) {
        analytics.averageResultsPerSearch = totalResults / recentSearches.length;
        analytics.emptyResultsRate = (emptyResults / recentSearches.length) * 100;
      }

      // Trier les top queries
      analytics.topQueries = Object.entries(analytics.topQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [query, count]) => {
          obj[query] = count;
          return obj;
        }, {});

      return analytics;
    } catch (error) {
      logger.error('Erreur analytics recherche:', error.message);
      return {};
    }
  }

  async optimizeIndex() {
    try {
      logger.info('Optimisation de l\'index de recherche...');
      
      // Nettoyer l'historique des recherches anciennes
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 jours
      const originalLength = this.searchHistory.length;
      this.searchHistory = this.searchHistory.filter(
        search => search.timestamp > cutoffTime
      );
      
      const cleanedHistory = originalLength - this.searchHistory.length;

      // Optimiser Elasticsearch si disponible
      let esOptimized = false;
      if (this.elasticsearch) {
        try {
          await this.elasticsearch.indices.forcemerge({
            index: 'wolofdict_*',
            max_num_segments: 1
          });
          esOptimized = true;
        } catch (error) {
          logger.warn('Erreur optimisation Elasticsearch:', error.message);
        }
      }

      // Reconstruire l'index si nécessaire
      if (this.models) {
        await this.buildSearchIndex();
      }

      logger.info('Optimisation terminée:', {
        indexSize: this.searchIndex.size,
        cleanedHistory,
        esOptimized
      });

      return {
        success: true,
        indexSize: this.searchIndex.size,
        historySize: this.searchHistory.length,
        cleanedHistory,
        esOptimized
      };
    } catch (error) {
      logger.error('Erreur optimisation index:', error.message);
      throw error;
    }
  }

  // Nettoyage périodique
  async cleanup() {
    try {
      // Nettoyer l'historique des recherches (garder 30 jours)
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const originalLength = this.searchHistory.length;
      
      this.searchHistory = this.searchHistory.filter(
        search => search.timestamp > cutoffTime
      );
      
      const cleaned = originalLength - this.searchHistory.length;
      
      if (cleaned > 0) {
        logger.debug(`Nettoyage SearchService: ${cleaned} recherches anciennes supprimées`);
      }
    } catch (error) {
      logger.error('Erreur nettoyage SearchService:', error.message);
    }
  }

  async getSearchStats() {
    return {
      indexSize: this.searchIndex.size,
      historySize: this.searchHistory.length,
      hasElasticsearch: !!this.elasticsearch,
      hasFuse: !!this.Fuse,
      hasModels: !!this.models
    };
  }

  getDetailedStatus() {
    const memoryUsage = process.memoryUsage();
    
    return {
      name: this.name,
      initialized: this.isInitialized,
      engines: {
        elasticsearch: !!this.elasticsearch,
        fuse: !!this.Fuse,
        basic: true
      },
      index: {
        size: this.searchIndex.size,
        memoryUsage: Math.round((JSON.stringify([...this.searchIndex]).length / 1024 / 1024) * 100) / 100 + ' MB'
      },
      history: {
        size: this.searchHistory.length,
        memoryUsage: Math.round((JSON.stringify(this.searchHistory).length / 1024) * 100) / 100 + ' KB'
      },
      performance: {
        nodeMemory: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        uptime: process.uptime()
      },
      hasModels: !!this.models,
      timestamp: new Date().toISOString()
    };
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasElasticsearch: !!this.elasticsearch,
      hasFuse: !!this.Fuse,
      hasModels: !!this.models,
      indexSize: this.searchIndex.size,
      searchHistorySize: this.searchHistory.length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SearchService();