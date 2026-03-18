function isAdminLoggedIn(req) {
  return !!req.session.admin_id;
}

function requireAdmin(req, res, next) {
  if (!isAdminLoggedIn(req)) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

module.exports = { isAdminLoggedIn, requireAdmin };
