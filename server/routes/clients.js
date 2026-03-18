const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDB, generateToken } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { validateCSRF } = require('../middleware/csrf');
const config = require('../config');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  const db = getDB();
  const action = req.query.action || 'list';

  if (action === 'list') {
    const [clients] = await db.query(
      'SELECT c.*, t.name as template_name, t.niche FROM clients c JOIN templates t ON c.template_id = t.id ORDER BY c.created_at DESC'
    );
    const stats = {
      total: 0, formulario_pendente: 0, formulario_preenchido: 0, em_edicao: 0,
      aguardando_aprovacao: 0, alteracao_solicitada: 0, aprovado: 0, publicado: 0,
    };
    for (const c of clients) {
      stats.total++;
      if (stats[c.status] !== undefined) stats[c.status]++;
    }
    return res.json({ clients, stats });
  }

  if (action === 'detail') {
    const id = parseInt(req.query.id) || 0;
    const [rows] = await db.execute(
      'SELECT c.*, t.name as template_name, t.slug as template_slug, t.niche FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.id = ?',
      [id]
    );
    const client = rows[0];
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    // Parse JSON fields
    if (client.form_data && typeof client.form_data === 'string') {
      client.form_data = JSON.parse(client.form_data);
    }
    if (client.site_data && typeof client.site_data === 'string') {
      client.site_data = JSON.parse(client.site_data);
    }

    const [revisions] = await db.execute(
      'SELECT * FROM revisions WHERE client_id = ? ORDER BY created_at DESC',
      [id]
    );
    return res.json({ client, revisions });
  }

  if (action === 'templates') {
    const [templates] = await db.query('SELECT * FROM templates ORDER BY name');
    return res.json({ templates });
  }

  res.status(400).json({ error: 'Bad request' });
});

router.post('/', async (req, res) => {
  const db = getDB();
  const { action, csrf_token } = req.body;

  if (!validateCSRF(req, csrf_token)) {
    return res.status(403).json({ error: 'Token CSRF inválido' });
  }

  if (action === 'create') {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const phone = (req.body.phone || '').trim();
    const template_id = parseInt(req.body.template_id) || 1;

    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const token = generateToken();
    const review_token = generateToken();

    const [result] = await db.execute(
      'INSERT INTO clients (token, review_token, template_id, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [token, review_token, template_id, name, email, phone]
    );
    const id = result.insertId;

    // Create upload directory
    const uploadDir = `${config.paths.uploads}/${token}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Copy template files to client's site directory
    const [tplRows] = await db.execute('SELECT slug FROM templates WHERE id = ?', [template_id]);
    if (tplRows.length > 0) {
      const templateDir = path.join(config.paths.templates, tplRows[0].slug);
      const siteDir = path.join(config.paths.sites, token);
      if (fs.existsSync(templateDir)) {
        copyDirSync(templateDir, siteDir);
      }
    }

    const [rows] = await db.execute(
      'SELECT c.*, t.name as template_name FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.id = ?',
      [id]
    );
    return res.json({ success: true, client: rows[0] });
  }

  if (action === 'update_status') {
    const id = parseInt(req.body.id) || 0;
    const status = req.body.status || '';
    const valid = ['formulario_pendente', 'formulario_preenchido', 'em_edicao', 'aguardando_aprovacao', 'alteracao_solicitada', 'aprovado', 'publicado'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Status inválido' });
    const statusLabels = {
      formulario_pendente: 'Formulário Pendente',
      formulario_preenchido: 'Formulário Preenchido',
      em_edicao: 'Em Edição',
      aguardando_aprovacao: 'Aguardando Aprovação',
      alteracao_solicitada: 'Alteração Solicitada',
      aprovado: 'Aprovado',
      publicado: 'Entregue',
    };
    await db.execute('UPDATE clients SET status = ? WHERE id = ?', [status, id]);
    await db.execute(
      "INSERT INTO revisions (client_id, type, message) VALUES (?, 'submit', ?)",
      [id, `Status alterado para ${statusLabels[status] || status}`]
    );
    return res.json({ success: true });
  }

  if (action === 'save_site_data') {
    const id = parseInt(req.body.id) || 0;
    const site_data = req.body.site_data;
    if (!id || site_data === undefined || site_data === null) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    await db.execute('UPDATE clients SET site_data = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(site_data), id]);
    await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'publish', 'Atualização publicada pelo admin')", [id]);
    return res.json({ success: true });
  }

  res.status(400).json({ error: 'Bad request' });
});

// DELETE client and all associated data
router.delete('/:id', async (req, res) => {
  const db = getDB();
  const id = parseInt(req.params.id) || 0;
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Get client token to find directories
    const [rows] = await db.execute('SELECT token FROM clients WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' });

    const token = rows[0].token;
    const path = require('path');

    // Delete uploads directory
    const uploadsDir = path.join(config.paths.uploads, token);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }

    // Delete sites directory
    const sitesDir = path.join(config.paths.sites, token);
    if (fs.existsSync(sitesDir)) {
      fs.rmSync(sitesDir, { recursive: true, force: true });
    }

    // Delete uploads records from DB
    await db.execute('DELETE FROM uploads WHERE client_token = ?', [token]);

    // Delete revisions (also cascades, but explicit is safer)
    await db.execute('DELETE FROM revisions WHERE client_id = ?', [id]);

    // Delete client
    await db.execute('DELETE FROM clients WHERE id = ?', [id]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    return res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

module.exports = router;
