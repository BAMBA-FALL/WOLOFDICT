// =============================================================================
// 🌍 WOLOFDICT - CONFIGURATION CENTRALISÉE
// Configuration pour tous les services
// =============================================================================

module.exports = {
  // Application
  app: {
    name: 'WolofDict',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  },

  // Base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'wolofdict',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql'
  },

  // Authentification
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'wolofdict-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES || '7d',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '30d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD
  },

  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-1',
    s3Bucket: process.env.AWS_S3_BUCKET
  },

  // Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760,
    allowedTypes: ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav'],
    destination: process.env.UPLOAD_DESTINATION || 'uploads/'
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  // Firebase
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    databaseUrl: process.env.FIREBASE_DATABASE_URL
  },

  // Search
  search: {
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  },

  // AI Services
  ai: {
    googleCloudKeyPath: process.env.GOOGLE_CLOUD_KEY_PATH,
    googleProjectId: process.env.GOOGLE_PROJECT_ID
  }
};
