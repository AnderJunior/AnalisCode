const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, `site_${Date.now()}.zip`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Somente arquivos .zip são permitidos'));
    }
  },
});

router.post('/', requireAdmin, upload.single('site_zip'), async (req, res) => {
  const id = parseInt(req.body.id) || 0;
  if (!id) return res.status(400).json({ error: 'ID do cliente inválido' });
  if (!req.file) return res.status(400).json({ error: 'Arquivo ZIP não recebido' });

  const db = getDB();
  const [rows] = await db.execute('SELECT token FROM clients WHERE id = ?', [id]);
  const client = rows[0];
  if (!client) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const siteDir = path.join(config.paths.sites, client.token);

  // Remove previous site
  if (fs.existsSync(siteDir)) {
    fs.rmSync(siteDir, { recursive: true, force: true });
  }
  fs.mkdirSync(siteDir, { recursive: true });

  try {
    const zip = new AdmZip(req.file.path);
    const entries = zip.getEntries();

    // Detect single top-level folder to strip
    const topFolders = new Set();
    for (const entry of entries) {
      const parts = entry.entryName.split('/');
      if (parts[0]) topFolders.add(parts[0]);
    }

    let stripPrefix = '';
    if (topFolders.size === 1) {
      const folder = [...topFolders][0];
      // Check if it's a folder (has trailing slash entry)
      const isFolderEntry = entries.some(e => e.entryName === folder + '/');
      if (isFolderEntry) stripPrefix = folder + '/';
    }

    // Extract entries
    for (const entry of entries) {
      let relative = entry.entryName;
      if (stripPrefix && relative.startsWith(stripPrefix)) {
        relative = relative.slice(stripPrefix.length);
      }
      if (!relative) continue;

      const dest = path.join(siteDir, relative);
      if (entry.isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      } else {
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dest, entry.getData());
      }
    }

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    // Check index.html
    if (!fs.existsSync(path.join(siteDir, 'index.html'))) {
      return res.json({
        success: true,
        warning: 'ZIP extraído mas index.html não encontrado',
        url: `/sites/${client.token}/`,
      });
    }

    // Save revision
    await db.execute(
      "INSERT INTO revisions (client_id, type, message) VALUES (?, 'publish', 'Site personalizado enviado pelo admin')",
      [id]
    );

    res.json({ success: true, url: `/sites/${client.token}/index.html` });
  } catch (err) {
    // Cleanup temp file on error
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Falha ao extrair o ZIP: ' + err.message });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
