const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db');
const { isAdminLoggedIn } = require('../middleware/auth');
const { generateCSRFToken, validateCSRF } = require('../middleware/csrf');

const router = express.Router();

router.get('/', (req, res) => {
  const token = generateCSRFToken(req);
  res.json({ authenticated: isAdminLoggedIn(req), csrf_token: token });
});

router.post('/', async (req, res) => {
  const { action, username, password, csrf_token } = req.body;

  if (action === 'login') {
    if (!validateCSRF(req, csrf_token)) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    const trimmedUser = (username || '').trim();
    const db = getDB();
    const [rows] = await db.execute('SELECT id, password FROM admins WHERE username = ?', [trimmedUser]);
    const admin = rows[0];

    if (admin && await bcrypt.compare(password || '', admin.password)) {
      req.session.admin_id = admin.id;
      req.session.admin_user = trimmedUser;
      // Regenerate CSRF after login
      req.session.csrf_token = null;
      const newToken = generateCSRFToken(req);
      return res.json({ success: true, csrf_token: newToken });
    }
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }

  if (action === 'logout') {
    req.session.destroy(() => {
      res.json({ success: true });
    });
    return;
  }

  res.status(400).json({ error: 'Bad request' });
});

module.exports = router;
