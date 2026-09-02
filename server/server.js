try { require('dotenv').config(); } catch(e) {}
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// Trust proxy (behind Traefik/Nginx)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.APP_URL || 'https://sites.analiscode.com']
  : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
// Store persistente no MySQL — sem isto as sessões vivem só na memória do
// processo e todo restart do servidor desloga todos os admins.
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  createDatabaseTable: true,
  charset: 'utf8mb4_bin',
  expiration: config.session.cookie.maxAge,
  checkExpirationInterval: 15 * 60 * 1000, // limpa expiradas a cada 15min
});
sessionStore.on('error', (err) => console.error('Session store error:', err));

app.use(session({ ...config.session, store: sessionStore }));

// Static files
app.use('/uploads', express.static(config.paths.uploads));
app.use('/templates', express.static(config.paths.templates));
app.use('/sites', express.static(config.paths.sites));
app.use('/form', express.static(path.join(__dirname, '..', 'form'), { index: false }));

// API Routes — keep .php paths so frontend needs zero changes
app.use('/api/auth.php', require('./routes/auth'));
app.use('/api/clients.php', require('./routes/clients'));
app.use('/api/form-schema.php', require('./routes/formSchema'));
app.use('/api/submit.php', require('./routes/submit'));
app.use('/api/upload.php', require('./routes/upload'));
app.use('/api/upload-site.php', require('./routes/uploadSite'));
app.use('/api/preview.php', require('./routes/preview'));
app.use('/api/approve.php', require('./routes/approve'));
app.use('/api/template-preview.php', require('./routes/templatePreview'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/kanban-columns', require('./routes/kanbanColumns'));
app.use('/form', require('./routes/form'));

// Auto-migrations
const { getDB } = require('./db');
(async () => {
  const db = getDB();
  const migrations = [
    "ALTER TABLE revisions MODIFY COLUMN type ENUM('submit','revision_request','approval','publish') NOT NULL",
    "ALTER TABLE clients ADD COLUMN form_opened_at TIMESTAMP NULL DEFAULT NULL",
    "CREATE TABLE IF NOT EXISTS forms (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, schema JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
    "ALTER TABLE clients ADD COLUMN form_id INT NULL DEFAULT NULL",
    "ALTER TABLE clients MODIFY COLUMN status VARCHAR(100) DEFAULT 'formulario_pendente'",
    "ALTER TABLE clients MODIFY COLUMN template_id INT NULL DEFAULT NULL",
    "CREATE TABLE IF NOT EXISTS kanban_columns (id INT AUTO_INCREMENT PRIMARY KEY, `key` VARCHAR(100) UNIQUE NOT NULL, label VARCHAR(255) NOT NULL, color VARCHAR(20) DEFAULT '#6366f1', position INT DEFAULT 0, is_final BOOLEAN DEFAULT FALSE, role VARCHAR(50) DEFAULT NULL)",
    "ALTER TABLE kanban_columns ADD COLUMN role VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE clients ADD COLUMN deadline_days INT NULL DEFAULT NULL",
    "ALTER TABLE clients ADD COLUMN deadline_date DATE NULL DEFAULT NULL",
    "ALTER TABLE clients ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pendente'",
    "ALTER TABLE clients ADD COLUMN payment_amount DECIMAL(10,2) NULL DEFAULT NULL",
    "ALTER TABLE clients ADD COLUMN payment_received_at DATE NULL DEFAULT NULL",
    "ALTER TABLE clients ADD COLUMN payment_status_at DATETIME NULL DEFAULT NULL",
  ];
  for (const sql of migrations) {
    try { await db.execute(sql); } catch {}
  }
})();

// Serve frontend in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(config.app.port, () => {
  console.log(`AnalisCode server running on http://localhost:${config.app.port}`);
});
