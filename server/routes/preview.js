const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db');
const { renderTemplate, loadDefaultData } = require('../lib/renderer');
const config = require('../config');

const router = express.Router();

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site em desenvolvimento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #334155; }
    .container { text-align: center; max-width: 420px; padding: 40px; }
    .icon { width: 64px; height: 64px; margin: 0 auto 24px; background: #e0f2fe; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 32px; height: 32px; color: #0284c7; }
    h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <h1>Seu site est\u00e1 em desenvolvimento</h1>
    <p>Aguarde at\u00e9 que possamos adicionar uma pr\u00e9-visualiza\u00e7\u00e3o para voc\u00ea.</p>
  </div>
</body>
</html>`;

router.get('/', async (req, res) => {
  const token = req.query.token || '';
  if (!token) return res.status(404).type('html').send(PLACEHOLDER_HTML);

  const db = getDB();
  const [rows] = await db.execute(
    'SELECT c.*, t.slug as template_slug FROM clients c LEFT JOIN templates t ON c.template_id = t.id WHERE c.token = ? OR c.review_token = ?',
    [token, token]
  );
  const client = rows[0];
  if (!client) return res.status(404).type('html').send(PLACEHOLDER_HTML);

  // Check for custom uploaded site
  const customSite = path.join(config.paths.sites, client.token, 'index.html');
  if (fs.existsSync(customSite)) {
    return res.redirect(`/sites/${client.token}/index.html`);
  }

  // If no template, show placeholder
  if (!client.template_slug) {
    return res.type('html').send(PLACEHOLDER_HTML);
  }

  // Check if template has template.html
  const templatePath = path.join(config.paths.templates, client.template_slug, 'template.html');
  if (!fs.existsSync(templatePath)) {
    return res.type('html').send(PLACEHOLDER_HTML);
  }

  // Determine data source
  let data = {};
  if (client.site_data) {
    data = typeof client.site_data === 'string' ? JSON.parse(client.site_data) : client.site_data;
  } else if (client.form_data) {
    data = typeof client.form_data === 'string' ? JSON.parse(client.form_data) : client.form_data;
  } else {
    try { data = loadDefaultData(client.template_slug); } catch { data = {}; }
  }

  try {
    let html = renderTemplate(client.template_slug, data);

    const highlightScript = `
<style>
  .ac-highlight-overlay {
    outline: 3px solid rgba(45, 106, 79, 0.6) !important;
    outline-offset: -3px;
    box-shadow: inset 0 0 0 9999px rgba(45, 106, 79, 0.05) !important;
    transition: all 0.3s ease !important;
  }
</style>
<script>
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.action) return;
    document.querySelectorAll('.ac-highlight-overlay').forEach(function(el) {
      el.classList.remove('ac-highlight-overlay');
    });
    if (e.data.action === 'highlight' && e.data.section) {
      var target = document.querySelector(e.data.section);
      if (target) {
        target.classList.add('ac-highlight-overlay');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (e.data.action === 'scrollTo' && e.data.section) {
      var target = document.querySelector(e.data.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
</script>`;

    html = html.replace('</body>', highlightScript + '\n</body>');
    res.type('html').send(html);
  } catch (err) {
    res.type('html').send(PLACEHOLDER_HTML);
  }
});

module.exports = router;
