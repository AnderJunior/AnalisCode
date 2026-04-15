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
    'SELECT c.*, t.slug as template_slug, t.name as template_name FROM clients c LEFT JOIN templates t ON c.template_id = t.id WHERE c.token = ?',
    [token]
  );
  const client = rows[0];
  if (!client) return res.status(404).json({ error: 'Token inválido' });

  let schema;

  // Priority: custom form > template schema > default schema
  if (client.form_id) {
    const [formRows] = await db.execute('SELECT `schema` FROM forms WHERE id = ?', [client.form_id]);
    if (formRows.length && formRows[0].schema) {
      schema = typeof formRows[0].schema === 'string' ? JSON.parse(formRows[0].schema) : formRows[0].schema;
    }
  }

  if (!schema) {
    const templateSlug = client.template_slug || '';
    const schemaPath = templateSlug ? path.join(config.paths.templates, templateSlug, 'schema.json') : '';
    const defaultSchemaPath = path.join(__dirname, '..', 'default-schema.json');

    if (schemaPath && fs.existsSync(schemaPath)) {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    } else if (fs.existsSync(defaultSchemaPath)) {
      schema = JSON.parse(fs.readFileSync(defaultSchemaPath, 'utf8'));
    } else {
      return res.status(500).json({ error: 'Schema não encontrado' });
    }
  }

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
