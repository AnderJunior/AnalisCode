const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { token, data } = req.body;

  if (!token || !data) {
    return res.status(400).json({ error: 'Missing token or data' });
  }

  const db = getDB();
  const [rows] = await db.execute('SELECT id, status FROM clients WHERE token = ?', [token]);
  const client = rows[0];
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const editableStatuses = ['formulario_pendente', 'formulario_preenchido'];
  if (!editableStatuses.includes(client.status)) {
    return res.status(400).json({ error: 'Formulário não pode ser editado neste momento' });
  }

  const isEdit = client.status === 'formulario_preenchido';

  await db.execute(
    "UPDATE clients SET form_data = ?, status = 'formulario_preenchido', updated_at = NOW() WHERE id = ?",
    [JSON.stringify(data), client.id]
  );

  const msg = isEdit ? 'Formulario atualizado pelo cliente' : 'Formulario preenchido pelo cliente';
  await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'submit', ?)", [client.id, msg]);

  res.json({ success: true });
});

module.exports = router;
