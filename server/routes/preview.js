const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db');
const { renderTemplate, loadDefaultData } = require('../lib/renderer');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.query.token || '';
  if (!token) return res.status(404).send('Token not provided');

  const db = getDB();
  const [rows] = await db.execute(
    'SELECT c.*, t.slug as template_slug FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.token = ? OR c.review_token = ?',
    [token, token]
  );
  const client = rows[0];
  if (!client) return res.status(404).send('Client not found');

  // Check for custom uploaded site
  const customSite = path.join(config.paths.sites, client.token, 'index.html');
  if (fs.existsSync(customSite)) {
    return res.redirect(`/sites/${client.token}/index.html`);
  }

  // Determine data source
  let data = {};
  if (client.site_data) {
    data = typeof client.site_data === 'string' ? JSON.parse(client.site_data) : client.site_data;
  } else if (client.form_data) {
    data = typeof client.form_data === 'string' ? JSON.parse(client.form_data) : client.form_data;
  } else {
    data = loadDefaultData(client.template_slug);
  }

  try {
    let html = renderTemplate(client.template_slug, data);

    // Inject highlight listener script for form preview integration
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

    // Remove previous highlights
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
    res.status(500).send('Error rendering template: ' + err.message);
  }
});

module.exports = router;
