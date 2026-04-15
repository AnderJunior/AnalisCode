const express = require('express');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_COLUMNS = [
  { key: 'formulario_pendente',   label: 'Form. Pendente',    color: '#9ca3af', position: 0, is_final: false },
  { key: 'formulario_preenchido', label: 'Form. Preenchido',  color: '#3b82f6', position: 1, is_final: false },
  { key: 'em_edicao',             label: 'Em Edição',         color: '#6366f1', position: 2, is_final: false },
  { key: 'aguardando_aprovacao',  label: 'Aguard. Aprovação', color: '#f59e0b', position: 3, is_final: false },
  { key: 'alteracao_solicitada',  label: 'Alter. Solicitada', color: '#f97316', position: 4, is_final: false },
  { key: 'aprovado',              label: 'Aprovado',          color: '#22c55e', position: 5, is_final: false },
  { key: 'publicado',             label: 'Entregue',          color: '#10b981', position: 6, is_final: true },
];

// GET - List all columns (ordered)
router.get('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const [rows] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
  if (rows.length === 0) {
    // Seed defaults
    for (const col of DEFAULT_COLUMNS) {
      await db.execute(
        'INSERT IGNORE INTO kanban_columns (`key`, label, color, position, is_final) VALUES (?, ?, ?, ?, ?)',
        [col.key, col.label, col.color, col.position, col.is_final]
      );
    }
    const [seeded] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
    return res.json(seeded);
  }
  res.json(rows);
});

// POST - Create column
router.post('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const { label, color } = req.body;
  if (!label) return res.status(400).json({ error: 'Label obrigatório' });
  const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const [maxPos] = await db.query('SELECT COALESCE(MAX(position), -1) as max_pos FROM kanban_columns');
  const position = maxPos[0].max_pos + 1;
  await db.execute(
    'INSERT INTO kanban_columns (`key`, label, color, position) VALUES (?, ?, ?, ?)',
    [key, label, color || '#6366f1', position]
  );
  const [rows] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
  res.json(rows);
});

// PUT - Update column
router.put('/:key', requireAdmin, async (req, res) => {
  const db = getDB();
  const { label, color, position, is_final } = req.body;
  const sets = [];
  const vals = [];
  if (label !== undefined) { sets.push('label = ?'); vals.push(label); }
  if (color !== undefined) { sets.push('color = ?'); vals.push(color); }
  if (position !== undefined) { sets.push('position = ?'); vals.push(position); }
  if (is_final !== undefined) {
    if (is_final) {
      // Remove final from all others first
      await db.execute('UPDATE kanban_columns SET is_final = FALSE');
    }
    sets.push('is_final = ?'); vals.push(is_final);
  }
  if (sets.length === 0) return res.json({ success: true });
  vals.push(req.params.key);
  await db.execute(`UPDATE kanban_columns SET ${sets.join(', ')} WHERE \`key\` = ?`, vals);
  const [rows] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
  res.json(rows);
});

// PUT - Reorder columns
router.put('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const { columns } = req.body; // array of { key, position }
  if (!columns || !Array.isArray(columns)) return res.status(400).json({ error: 'Dados inválidos' });
  for (const col of columns) {
    await db.execute('UPDATE kanban_columns SET position = ? WHERE `key` = ?', [col.position, col.key]);
  }
  const [rows] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
  res.json(rows);
});

// DELETE - Delete column
router.delete('/:key', requireAdmin, async (req, res) => {
  const db = getDB();
  // Move clients in this column to first column
  const [first] = await db.query('SELECT `key` FROM kanban_columns ORDER BY position ASC LIMIT 1');
  if (first.length && first[0].key !== req.params.key) {
    await db.execute('UPDATE clients SET status = ? WHERE status = ?', [first[0].key, req.params.key]);
  }
  await db.execute('DELETE FROM kanban_columns WHERE `key` = ?', [req.params.key]);
  const [rows] = await db.query('SELECT * FROM kanban_columns ORDER BY position ASC');
  res.json(rows);
});

module.exports = router;
