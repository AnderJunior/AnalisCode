const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { token, action, message } = req.body;

  if (!token || !['approve', 'request_revision'].includes(action)) {
    return res.status(400).json({ error: 'Missing token or invalid action' });
  }

  const db = getDB();
  const [rows] = await db.execute(
    'SELECT id, status FROM clients WHERE token = ? OR review_token = ?',
    [token, token]
  );
  const client = rows[0];
  if (!client) return res.status(404).json({ error: 'Client not found' });

  if (client.status !== 'aguardando_aprovacao') {
    return res.status(400).json({ error: 'Not in reviewable state' });
  }

  if (action === 'approve') {
    await db.execute("UPDATE clients SET status = 'aprovado', updated_at = NOW() WHERE id = ?", [client.id]);
    await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'approval', 'Site aprovado pelo cliente')", [client.id]);
  } else {
    await db.execute("UPDATE clients SET status = 'alteracao_solicitada', updated_at = NOW() WHERE id = ?", [client.id]);
    await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'revision_request', ?)", [client.id, message || '']);
  }

  res.json({ success: true });
});

module.exports = router;
