const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Duracao da sessao do admin (padrao: 30 dias). Ajuste via SESSION_MAX_AGE_DAYS.
const sessionMaxAgeDays = parseInt(process.env.SESSION_MAX_AGE_DAYS) || 30;

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'analiscode',
  },
  app: {
    name: 'AnalisCode',
    url: process.env.APP_URL || 'http://localhost:3000',
    port: parseInt(process.env.PORT) || 3000,
  },
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxTotal: 50 * 1024 * 1024, // 50MB per client
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
  },
  paths: {
    templates: path.join(__dirname, '..', 'templates'),
    uploads: path.join(__dirname, '..', 'uploads'),
    sites: path.join(__dirname, '..', 'sites'),
  },
  session: {
    secret: process.env.SESSION_SECRET || 'analiscode-secret-change-in-production',
    resave: false,
    rolling: true, // renova o prazo do cookie a cada requisicao
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: sessionMaxAgeDays * 24 * 60 * 60 * 1000,
    },
  },
};
