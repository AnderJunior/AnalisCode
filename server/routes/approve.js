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

  // Check if client is in an approval column (by role)
  const [colRows] = await db.execute(
    'SELECT `key` FROM kanban_columns WHERE role = ? AND `key` = ?',
    ['approval', client.status]
  );
  if (!colRows.length) {
    return res.status(400).json({ error: 'Not in reviewable state' });
  }

  if (action === 'approve') {
    // Find the next column after approval, or a column with 'finished' role
    const [allCols] = await db.query('SELECT `key`, position, role FROM kanban_columns ORDER BY position ASC');
    const approvalCol = allCols.find(c => c.role === 'approval');
    const finishedCol = allCols.find(c => c.role === 'finished');
    // Move to next column after approval, or finished column
    let nextKey;
    if (approvalCol) {
      const nextCol = allCols.find(c => c.position > approvalCol.position);
      nextKey = nextCol ? nextCol.key : (finishedCol ? finishedCol.key : 'aprovado');
    } else {
      nextKey = finishedCol ? finishedCol.key : 'aprovado';
    }
    await db.execute('UPDATE clients SET status = ?, updated_at = NOW() WHERE id = ?', [nextKey, client.id]);
    await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'approval', 'Site aprovado pelo cliente')", [client.id]);
  } else {
    // Find column before approval for revision
    const [allCols] = await db.query('SELECT `key`, position FROM kanban_columns ORDER BY position ASC');
    const approvalCol = allCols.find(c => c.key === client.status);
    let prevKey = client.status;
    if (approvalCol) {
      const prevCol = allCols.filter(c => c.position < approvalCol.position).pop();
      if (prevCol) prevKey = prevCol.key;
    }
    await db.execute('UPDATE clients SET status = ?, updated_at = NOW() WHERE id = ?', [prevKey, client.id]);
    await db.execute("INSERT INTO revisions (client_id, type, message) VALUES (?, 'revision_request', ?)", [client.id, message || 'Alteração solicitada pelo cliente']);
  }

  res.json({ success: true });
});

module.exports = router;
