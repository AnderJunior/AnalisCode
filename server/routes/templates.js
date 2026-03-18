const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { validateCSRF } = require('../middleware/csrf');
const config = require('../config');

const router = express.Router();

// Multer for ZIP + thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, `template_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

// GET - List all templates
router.get('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const [templates] = await db.query('SELECT * FROM templates ORDER BY created_at DESC, id DESC');
  res.json({ templates });
});

// POST - Create new template
router.post('/', requireAdmin, upload.fields([
  { name: 'zip_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  const { name, niche } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do template é obrigatório' });
  }

  if (!req.files || !req.files.zip_file) {
    return res.status(400).json({ error: 'Arquivo ZIP é obrigatório' });
  }

  const zipFile = req.files.zip_file[0];
  const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

  // Generate slug from name
  const slug = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const db = getDB();

  // Check if slug already exists
  const [existing] = await db.execute('SELECT id FROM templates WHERE slug = ?', [slug]);
  if (existing.length > 0) {
    cleanup(zipFile, thumbnailFile);
    return res.status(400).json({ error: 'Já existe um template com este nome' });
  }

  const templateDir = path.join(config.paths.templates, slug);

  try {
    // Create template directory
    if (fs.existsSync(templateDir)) {
      fs.rmSync(templateDir, { recursive: true, force: true });
    }
    fs.mkdirSync(templateDir, { recursive: true });

    // Extract ZIP
    const zip = new AdmZip(zipFile.path);
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
      const isFolderEntry = entries.some(e => e.entryName === folder + '/');
      if (isFolderEntry) stripPrefix = folder + '/';
    }

    for (const entry of entries) {
      let relative = entry.entryName;
      if (stripPrefix && relative.startsWith(stripPrefix)) {
        relative = relative.slice(stripPrefix.length);
      }
      if (!relative) continue;

      const dest = path.join(templateDir, relative);
      if (entry.isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      } else {
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dest, entry.getData());
      }
    }

    // Save thumbnail if provided
    let thumbnailPath = null;
    if (thumbnailFile) {
      const ext = path.extname(thumbnailFile.originalname).toLowerCase();
      const thumbName = `thumbnail${ext}`;
      const thumbDest = path.join(templateDir, thumbName);
      fs.copyFileSync(thumbnailFile.path, thumbDest);
      thumbnailPath = `/templates/${slug}/${thumbName}`;
    }

    // Check for template.html or index.html
    const hasTemplate = fs.existsSync(path.join(templateDir, 'template.html'));
    const hasIndex = fs.existsSync(path.join(templateDir, 'index.html'));

    // Insert into database
    const [result] = await db.execute(
      'INSERT INTO templates (name, slug, niche, thumbnail) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, (niche || '').trim(), thumbnailPath]
    );

    cleanup(zipFile, thumbnailFile);

    res.json({
      success: true,
      template: {
        id: result.insertId,
        name: name.trim(),
        slug,
        niche: (niche || '').trim(),
        thumbnail: thumbnailPath,
      },
      warnings: !hasTemplate && !hasIndex ? ['Nenhum template.html ou index.html encontrado no ZIP'] : [],
    });
  } catch (err) {
    cleanup(zipFile, thumbnailFile);
    // Remove template dir on failure
    if (fs.existsSync(templateDir)) {
      fs.rmSync(templateDir, { recursive: true, force: true });
    }
    res.status(500).json({ error: 'Falha ao processar template: ' + err.message });
  }
});

// PUT - Update template info (name, niche, thumbnail)
router.put('/:id', requireAdmin, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const { name, niche } = req.body;
  const db = getDB();

  const [rows] = await db.execute('SELECT * FROM templates WHERE id = ?', [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Template não encontrado' });
  }

  const template = rows[0];
  const updatedName = (name || template.name).trim();
  const updatedNiche = (niche !== undefined ? niche : template.niche || '').trim();

  // Handle thumbnail update
  let thumbnailPath = template.thumbnail;
  const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
  if (thumbnailFile) {
    const templateDir = path.join(config.paths.templates, template.slug);
    const ext = path.extname(thumbnailFile.originalname).toLowerCase();
    const thumbName = `thumbnail${ext}`;
    const thumbDest = path.join(templateDir, thumbName);
    if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });
    fs.copyFileSync(thumbnailFile.path, thumbDest);
    thumbnailPath = `/templates/${template.slug}/${thumbName}`;
    try { fs.unlinkSync(thumbnailFile.path); } catch {}
  }

  await db.execute(
    'UPDATE templates SET name = ?, niche = ?, thumbnail = ? WHERE id = ?',
    [updatedName, updatedNiche, thumbnailPath, id]
  );

  res.json({
    success: true,
    template: { id, name: updatedName, slug: template.slug, niche: updatedNiche, thumbnail: thumbnailPath },
  });
});

// DELETE - Remove template
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const db = getDB();

  // Check if template is used by any client
  const [clients] = await db.execute('SELECT COUNT(*) as count FROM clients WHERE template_id = ?', [id]);
  if (clients[0].count > 0) {
    return res.status(400).json({ error: `Template está sendo usado por ${clients[0].count} cliente(s)` });
  }

  const [rows] = await db.execute('SELECT slug FROM templates WHERE id = ?', [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Template não encontrado' });
  }

  const slug = rows[0].slug;
  const templateDir = path.join(config.paths.templates, slug);

  // Remove from database
  await db.execute('DELETE FROM templates WHERE id = ?', [id]);

  // Remove directory
  if (fs.existsSync(templateDir)) {
    fs.rmSync(templateDir, { recursive: true, force: true });
  }

  res.json({ success: true });
});

function cleanup(zipFile, thumbnailFile) {
  try { if (zipFile && fs.existsSync(zipFile.path)) fs.unlinkSync(zipFile.path); } catch {}
  try { if (thumbnailFile && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path); } catch {}
}

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
