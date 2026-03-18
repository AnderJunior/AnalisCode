const express = require('express');
const path = require('path');
const fs = require('fs');
const { renderTemplate, loadDefaultData } = require('../lib/renderer');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const slug = req.query.slug || '';
  if (!slug) return res.status(400).send('Slug not provided');

  const templateDir = path.join(config.paths.templates, slug);
  const templateHtml = path.join(templateDir, 'template.html');
  const indexHtml = path.join(templateDir, 'index.html');

  // If template.html exists, render with data
  if (fs.existsSync(templateHtml)) {
    try {
      const data = loadDefaultData(slug);
      const html = renderTemplate(slug, data);
      return res.type('html').send(html);
    } catch (err) {
      return res.status(500).send('Erro ao renderizar template: ' + err.message);
    }
  }

  // Fallback: serve index.html as static site with base tag for relative assets
  if (fs.existsSync(indexHtml)) {
    let html = fs.readFileSync(indexHtml, 'utf8');
    // Inject <base> tag so relative paths resolve to /templates/{slug}/
    if (!html.includes('<base')) {
      html = html.replace('<head>', `<head><base href="/templates/${slug}/">`);
    }
    return res.type('html').send(html);
  }

  res.status(404).send('Template não encontrado: nenhum template.html ou index.html em ' + slug);
});

// Serve static assets (css, js, images) from template directory
router.get('/:slug/*', (req, res) => {
  const slug = req.params.slug;
  const filePath = path.join(config.paths.templates, slug, req.params[0]);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send('Not found');
});

module.exports = router;
