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
app.use(session(config.session));

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
app.use('/form', require('./routes/form'));

// Auto-migrations
const { getDB } = require('./db');
(async () => {
  const db = getDB();
  const migrations = [
    "ALTER TABLE revisions MODIFY COLUMN type ENUM('submit','revision_request','approval','publish') NOT NULL",
    "ALTER TABLE clients ADD COLUMN form_opened_at TIMESTAMP NULL DEFAULT NULL",
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
