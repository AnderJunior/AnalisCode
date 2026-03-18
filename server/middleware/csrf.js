const crypto = require('crypto');

function generateCSRFToken(req) {
  if (!req.session.csrf_token) {
    req.session.csrf_token = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrf_token;
}

function validateCSRF(req, token) {
  if (!req.session.csrf_token || !token) return false;
  try {
    const a = Buffer.from(req.session.csrf_token, 'utf8');
    const b = Buffer.from(token, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = { generateCSRFToken, validateCSRF };
