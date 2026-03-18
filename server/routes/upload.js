const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db');
const config = require('../config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP, AVIF'));
    }
  },
});

router.post('/', upload.single('file'), async (req, res) => {
  const token = req.body.token || '';
  const fieldKey = req.body.field_key || '';

  if (!token || !fieldKey || !req.file) {
    return res.status(400).json({ error: 'Missing token, field_key, or file' });
  }

  const db = getDB();
  const [rows] = await db.execute('SELECT id FROM clients WHERE token = ?', [token]);
  if (!rows[0]) {
    // Cleanup temp file
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Client not found' });
  }

  // Build filename
  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
  const ext = mimeToExt[req.file.mimetype] || 'jpg';
  const safeKey = fieldKey.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `${safeKey}_${Date.now()}.${ext}`;

  // Move to final location
  const uploadDir = path.join(config.paths.uploads, token);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const dest = path.join(uploadDir, filename);
  fs.renameSync(req.file.path, dest);

  // Record in DB
  await db.execute(
    'INSERT INTO uploads (client_token, field_key, filename, original_name, file_size) VALUES (?, ?, ?, ?, ?)',
    [token, fieldKey, filename, req.file.originalname, req.file.size]
  );

  const url = `uploads/${token}/${filename}`;
  res.json({ success: true, url });
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 2MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
