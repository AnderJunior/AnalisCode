const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.query.token || '';
  if (!token) return res.status(400).json({ error: 'Token obrigatório' });

  const db = getDB();
  const [rows] = await db.execute(
    'SELECT c.*, t.slug as template_slug, t.name as template_name FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.token = ?',
    [token]
  );
  const client = rows[0];
  if (!client) return res.status(404).json({ error: 'Token inválido' });

  const schemaPath = path.join(config.paths.templates, client.template_slug, 'schema.json');
  if (!fs.existsSync(schemaPath)) {
    return res.status(500).json({ error: 'Schema não encontrado' });
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  const [uploads] = await db.execute('SELECT * FROM uploads WHERE client_token = ?', [token]);
  const uploadsMap = {};
  for (const u of uploads) {
    uploadsMap[u.field_key] = `uploads/${token}/${u.filename}`;
  }

  res.json({
    client: { name: client.name, status: client.status, template_name: client.template_name },
    schema,
    form_data: client.form_data ? (typeof client.form_data === 'string' ? JSON.parse(client.form_data) : client.form_data) : null,
    uploads: uploadsMap,
  });
});

module.exports = router;
