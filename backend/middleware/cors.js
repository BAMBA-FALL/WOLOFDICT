// =============================================================================
// 📄 middleware/cors.js - CONFIGURATION CORS
// =============================================================================

const cors = require('cors');

const corsConfig = cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://wolofdict.com',
      'https://www.wolofdict.com',
      'https://app.wolofdict.com'
    ];

    // Permettre les requêtes sans origin (mobile apps, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

module.exports = {
  corsConfig
};