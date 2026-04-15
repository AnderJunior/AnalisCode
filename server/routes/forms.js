const express = require('express');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET - List all forms
router.get('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const [forms] = await db.query('SELECT id, name, description, created_at, updated_at FROM forms ORDER BY created_at DESC');
  res.json(forms);
});

// GET - Single form with schema
router.get('/:id', requireAdmin, async (req, res) => {
  const db = getDB();
  const [rows] = await db.execute('SELECT * FROM forms WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Formulário não encontrado' });
  const form = rows[0];
  form.schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
  res.json(form);
});

// POST - Create form
router.post('/', requireAdmin, async (req, res) => {
  const db = getDB();
  const { name, description, schema } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const [result] = await db.execute(
    'INSERT INTO forms (name, description, schema) VALUES (?, ?, ?)',
    [name, description || '', JSON.stringify(schema || { steps: [] })]
  );
  res.json({ success: true, id: result.insertId });
});

// PUT - Update form
router.put('/:id', requireAdmin, async (req, res) => {
  const db = getDB();
  const { name, description, schema } = req.body;

  const sets = [];
  const vals = [];
  if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
  if (schema !== undefined) { sets.push('schema = ?'); vals.push(JSON.stringify(schema)); }
  sets.push('updated_at = NOW()');
  vals.push(req.params.id);

  await db.execute(`UPDATE forms SET ${sets.join(', ')} WHERE id = ?`, vals);
  res.json({ success: true });
});

// DELETE - Delete form
router.delete('/:id', requireAdmin, async (req, res) => {
  const db = getDB();
  // Unassign from clients first
  await db.execute('UPDATE clients SET form_id = NULL WHERE form_id = ?', [req.params.id]);
  await db.execute('DELETE FROM forms WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
