{
  "name": "wolofdict-backend",
  "version": "1.0.0",
  "description": "Backend API pour WolofDict - Plateforme collaborative wolof avec système business",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "seed": "sequelize-cli db:seed:all",
    "seed:undo": "sequelize-cli db:seed:undo:all",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "build": "npm run lint && npm test",
    "deploy": "pm2 start ecosystem.config.js --env production",
    "logs": "pm2 logs wolofdict-api",
    "restart": "pm2 restart wolofdict-api",
    "stop": "pm2 stop wolofdict-api"
  },
  "dependencies": {
    
    "//": "=== FRAMEWORK PRINCIPAL ===",
    "express": "^4.18.2",
    "express-rate-limit": "^6.10.0",
    "express-slow-down": "^1.6.0",
    "express-validator": "^7.0.1",
    "express-session": "^1.17.3",
    "express-fileupload": "^1.4.0",
    
    "//": "=== SÉCURITÉ ===",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "crypto": "^1.0.1",
    "argon2": "^0.31.0",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    
    "//": "=== BASE DE DONNÉES ===",
    "sequelize": "^6.32.1",
    "sequelize-cli": "^6.6.1",
    "mysql2": "^3.6.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "redis": "^4.6.7",
    "ioredis": "^5.3.2",
    
    "//": "=== BUSINESS - PAIEMENTS ===",
    "stripe": "^12.18.0",
    "@paypal/checkout-server-sdk": "^1.0.3",
    "paypal-rest-sdk": "^1.8.1",
    "orange-money-api": "^1.0.0",
    "wave-money-api": "^1.0.0",
    "flutterwave-node-v3": "^1.1.8",
    
    "//": "=== AUTHENTIFICATION SOCIALE ===",
    "passport": "^0.6.0",
    "passport-local": "^1.0.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-facebook": "^3.0.0",
    "passport-jwt": "^4.0.1",
    "passport-http-bearer": "^1.0.1",
    
    "//": "=== UPLOAD ET STOCKAGE ===",
    "multer": "^1.4.5-lts.1",
    "multer-s3": "^3.0.1",
    "aws-sdk": "^2.1445.0",
    "@aws-sdk/client-s3": "^3.385.0",
    "cloudinary": "^1.40.0",
    "sharp": "^0.32.4",
    "imagemin": "^8.0.1",
    "imagemin-mozjpeg": "^10.0.0",
    "imagemin-pngquant": "^9.0.2",
    
    "//": "=== AUDIO ET MÉDIA ===",
    "ffmpeg-static": "^5.1.0",
    "fluent-ffmpeg": "^2.1.2",
    "node-wav": "^0.0.2",
    "speech-to-text": "^2.0.0",
    "text-to-speech": "^1.0.0",
    
    "//": "=== COMMUNICATION ===",
    "nodemailer": "^6.9.4",
    "nodemailer-express-handlebars": "^6.1.0",
    "handlebars": "^4.7.8",
    "twilio": "^4.14.0",
    "node-pushnotifications": "^3.0.0",
    "firebase-admin": "^11.10.1",
    
    "//": "=== VALIDATION ET PARSING ===",
    "joi": "^17.9.2",
    "yup": "^1.2.0",
    "ajv": "^8.12.0",
    "validator": "^13.11.0",
    "sanitize-html": "^2.11.0",
    "dompurify": "^3.0.5",
    "jsdom": "^22.1.0",
    
    "//": "=== UTILITAIRES ===",
    "lodash": "^4.17.21",
    "moment": "^2.29.4",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.0",
    "nanoid": "^4.0.2",
    "slugify": "^1.6.6",
    "faker": "^5.5.3",
    "@faker-js/faker": "^8.0.2",
    
    "//": "=== COMPRESSION ET OPTIMISATION ===",
    "compression": "^1.7.4",
    "gzip": "^0.1.0",
    "brotli": "^1.3.3",
    "lru-cache": "^10.0.1",
    "node-cache": "^5.1.2",
    
    "//": "=== LOGGING ET MONITORING ===",
    "winston": "^3.10.0",
    "morgan": "^1.10.0",
    "pino": "^8.14.2",
    "pino-pretty": "^10.2.0",
    "winston-daily-rotate-file": "^4.7.1",
    "sentry": "^7.64.0",
    "@sentry/node": "^7.64.0",
    
    "//": "=== MÉTRIQUES ET ANALYTICS ===",
    "prom-client": "^14.2.0",
    "prometheus": "^0.1.3",
    "statsd-client": "^0.4.7",
    "newrelic": "^10.5.0",
    "datadog-metrics": "^0.9.3",
    
    "//": "=== INTERNATIONALISATION ===",
    "i18n": "^0.15.1",
    "i18next": "^23.4.4",
    "i18next-fs-backend": "^2.1.5",
    "accept-language": "^3.0.18",
    
    "//": "=== RECHERCHE ET INDEXATION ===",
    "elasticsearch": "^16.7.3",
    "@elastic/elasticsearch": "^8.9.0",
    "lunr": "^2.3.9",
    "fuse.js": "^6.6.2",
    "flexsearch": "^0.7.31",
    
    "//": "=== FORMATS ET PARSING ===",
    "csv-parser": "^3.0.0",
    "json2csv": "^6.1.0",
    "xml2js": "^0.6.2",
    "fast-xml-parser": "^4.2.7",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    
    "//": "=== CRYPTO ET HASHING ===",
    "crypto-js": "^4.1.1",
    "node-forge": "^1.3.1",
    "bcrypt": "^5.1.1",
    "scrypt": "^6.0.3",
    
    "//": "=== NETWORKING ===",
    "axios": "^1.5.0",
    "node-fetch": "^3.3.2",
    "request": "^2.88.2",
    "superagent": "^8.1.0",
    "socket.io": "^4.7.2",
    
    "//": "=== CRON ET TÂCHES ===",
    "node-cron": "^3.0.2",
    "agenda": "^4.3.0",
    "bull": "^4.11.3",
    "bull-board": "^4.0.4",
    "node-schedule": "^2.1.1",
    
    "//": "=== WEBSOCKET ===",
    "ws": "^8.13.0",
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    
    "//": "=== CONFIGURATION ===",
    "dotenv": "^16.3.1",
    "config": "^3.3.9",
    "convict": "^6.2.4",
    "rc": "^1.2.8",
    
    "//": "=== PROCESSUS ===",
    "pm2": "^5.3.0",
    "cluster": "^0.7.7",
    "forever": "^4.0.3",
    
    "//": "=== API DOCUMENTATION ===",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "redoc-express": "^2.1.0",
    "apispec": "^1.0.0",
    
    "//": "=== MIDDLEWARE SPÉCIALISÉS ===",
    "cookie-parser": "^1.4.6",
    "body-parser": "^1.20.2",
    "method-override": "^3.0.0",
    "connect-flash": "^0.1.1",
    "express-brute": "^1.0.1",
    "express-brute-redis": "^0.0.1",
    
    "//": "=== IA ET ML (PRÉPARATION) ===",
    "tensorflow": "^4.10.0",
    "@tensorflow/tfjs-node": "^4.10.0",
    "natural": "^6.5.0",
    "compromise": "^14.10.0",
    "franc": "^6.1.0",
    "langdetect": "^0.2.1",
    
    "//": "=== GÉNÉRATION DE CONTENU ===",
    "puppeteer": "^21.1.1",
    "playwright": "^1.37.1",
    "jspdf": "^2.5.1",
    "html-pdf": "^3.0.1",
    "chartjs-node": "^1.5.0",
    
    "//": "=== UTILS SYSTÈME ===",
    "fs-extra": "^11.1.1",
    "path": "^0.12.7",
    "os": "^0.1.2",
    "child_process": "^1.0.2",
    "stream": "^0.0.2",
    
    "//": "=== HEALTH CHECKS ===",
    "terminus": "^4.12.0",
    "lightship": "^6.19.0",
    "health-check": "^1.0.0"
  },
  
  "devDependencies": {
    
    "//": "=== TESTING ===",
    "jest": "^29.6.4",
    "supertest": "^6.3.3",
    "jest-environment-node": "^29.6.4",
    "jest-mock": "^29.6.3",
    "chai": "^4.3.8",
    "mocha": "^10.2.0",
    "sinon": "^15.2.0",
    "nock": "^13.3.2",
    "factory-girl": "^5.0.4",
    
    "//": "=== LINTING ET FORMATAGE ===",
    "eslint": "^8.47.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-plugin-import": "^2.28.1",
    "eslint-plugin-node": "^11.1.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.2",
    
    "//": "=== DÉVELOPPEMENT ===",
    "nodemon": "^3.0.1",
    "cross-env": "^7.0.3",
    "concurrently": "^8.2.0",
    "npm-run-all": "^4.1.5",
    
    "//": "=== BUILD ET DEPLOYMENT ===",
    "babel-core": "^6.26.3",
    "babel-preset-env": "^1.7.0",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4",
    "webpack-node-externals": "^3.0.0",
    
    "//": "=== ANALYSE DE CODE ===",
    "sonarjs": "^1.0.3",
    "jscpd": "^3.5.10",
    "complexity-report": "^2.0.0-alpha",
    "plato": "^1.7.0",
    
    "//": "=== DOCUMENTATION ===",
    "jsdoc": "^4.0.2",
    "documentation": "^14.0.2",
    "typedoc": "^0.25.0",
    
    "//": "=== TYPES (OPTIONNEL) ===",
    "@types/node": "^20.5.6",
    "@types/express": "^4.17.17",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/multer": "^1.4.7",
    "@types/redis": "^4.0.11",
    
    "//": "=== OUTILS DE DÉVELOPPEMENT ===",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3",
    "commitizen": "^4.3.0",
    "cz-conventional-changelog": "^3.3.0",
    "standard-version": "^9.5.0",
    
    "//": "=== DEBUGGING ===",
    "debug": "^4.3.4",
    "node-inspector": "^2.0.0",
    "why-is-node-running": "^2.2.2",
    
    "//": "=== PERFORMANCE ===",
    "clinic": "^12.1.0",
    "0x": "^5.5.0",
    "autocannon": "^7.12.0",
    "loadtest": "^8.0.2"
  },
  
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  
  "keywords": [
    "wolof",
    "dictionary",
    "senegal",
    "africa",
    "language",
    "learning",
    "collaborative",
    "api",
    "freemium",
    "ai",
    "nlp"
  ],
  
  "author": {
    "name": "WolofDict Team",
    "email": "dev@wolofdict.com",
    "url": "https://wolofdict.com"
  },
  
  "license": "MIT",
  
  "repository": {
    "type": "git",
    "url": "https://github.com/wolofdict/wolofdict-backend.git"
  },
  
  "bugs": {
    "url": "https://github.com/wolofdict/wolofdict-backend/issues"
  },
  
  "homepage": "https://wolofdict.com",
  
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  },
  
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  },
  
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/migrations/**",
      "!src/seeders/**",
      "!src/tests/**"
    ],
    "testMatch": [
      "**/tests/**/*.test.js",
      "**/src/**/*.test.js"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>/src/tests/setup.js"
    ]
  }
}