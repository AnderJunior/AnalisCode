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
  const defaultSchemaPath = path.join(__dirname, '..', 'default-schema.json');
  let schemaFile = schemaPath;
  if (!fs.existsSync(schemaPath)) {
    if (!fs.existsSync(defaultSchemaPath)) {
      return res.status(500).json({ error: 'Schema não encontrado' });
    }
    schemaFile = defaultSchemaPath;
  }
  const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));

  // Track form link open (only first time)
  if (!client.form_opened_at) {
    try {
      await db.execute('UPDATE clients SET form_opened_at = NOW() WHERE token = ? AND form_opened_at IS NULL', [token]);
    } catch (e) { /* column might not exist yet */ }
  }

  const [uploads] = await db.execute('SELECT * FROM uploads WHERE client_token = ?', [token]);
  const uploadsMap = {};
  for (const u of uploads) {
    uploadsMap[u.field_key] = `uploads/${token}/${u.filename}`;
  }

  res.json({
    client: { name: client.name, status: client.status, template_name: client.template_name, form_opened_at: client.form_opened_at },
    schema,
    form_data: client.form_data ? (typeof client.form_data === 'string' ? JSON.parse(client.form_data) : client.form_data) : null,
    uploads: uploadsMap,
  });
});

module.exports = router;
