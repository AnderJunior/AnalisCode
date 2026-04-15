const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { token, data, next_status } = req.body;

  if (!token || !data) {
    return res.status(400).json({ error: 'Missing token or data' });
  }

  const db = getDB();
  const [rows] = await db.execute('SELECT id, status FROM clients WHERE token = ?', [token]);
  const client = rows[0];
  if (!client) return res.status(404).json({ error: 'Client not found' });

  // Get kanban columns with roles
  const [cols] = await db.query('SELECT `key`, position, role FROM kanban_columns ORDER BY position ASC');
  const formPendingCol = cols.find(c => c.role === 'form_pending') || cols[0];
  const postFormCol = cols.find(c => c.role === 'post_form') || cols[1];

  const formPendingKey = formPendingCol?.key || 'formulario_pendente';
  const postFormKey = postFormCol?.key || 'formulario_preenchido';

  // Allow editing from form_pending or post_form columns
  const editableKeys = [formPendingKey, postFormKey];
  if (!editableKeys.includes(client.status)) {
    return res.status(400).json({ error: 'Formulário não pode ser editado neste momento' });
  }

  const isEdit = client.status === postFormKey;
  const targetStatus = next_status || postFormKey;

  await db.execute(
    'UPDATE clients SET form_data = ?, status = ?, updated_at = NOW() WHERE id = ?',
    [JSON.stringify(data), targetStatus, client.id]
  );

  const msg = isEdit ? 'Formulario atualizado pelo cliente' : 'Formulario preenchido pelo cliente';
  await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'submit', ?)", [client.id, msg]);

  res.json({ success: true });
});

module.exports = router;
