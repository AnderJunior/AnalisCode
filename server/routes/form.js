const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.query.token || '';
  if (!token) return res.status(404).send('Link invalido.');

  try {
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT c.*, t.slug as template_slug, t.name as template_name
       FROM clients c JOIN templates t ON c.template_id = t.id
       WHERE c.token = ?`,
      [token]
    );
    const client = rows[0];
    if (!client) return res.status(404).send('Link invalido.');

    // Load schema
    const schemaPath = path.join(config.paths.templates, client.template_slug, 'schema.json');
    let schema = { steps: [] };
    if (fs.existsSync(schemaPath)) {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    }

    const alreadyFilled = client.status !== 'formulario_pendente';
    const stepCount = (schema.steps || []).length;
    const previewUrl = `/api/preview.php?token=${token}`;
    const schemaJson = JSON.stringify(schema);

    if (alreadyFilled) {
      return res.type('html').send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulario ja enviado</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/form/form.css">
</head>
<body>
  <div class="done-page">
    <div class="done-card">
      <div class="done-icon">&#10003;</div>
      <h2>Formulario ja enviado!</h2>
      <p>Voce ja preencheu as informacoes do seu site. Aguarde nosso contato para a proxima etapa.</p>
    </div>
  </div>
</body>
</html>`);
    }

    res.type('html').send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preencha as informacoes do seu site</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/form/form.css">
</head>
<body>
  <div class="split-layout" id="split-layout">
    <!-- Left: Site Preview -->
    <div class="split-preview" id="split-preview">
      <div class="split-preview__header">
        <span class="split-preview__dot"></span>
        <span class="split-preview__dot"></span>
        <span class="split-preview__dot"></span>
        <span class="split-preview__title">Preview do seu site</span>
      </div>
      <iframe id="preview-iframe" src="${previewUrl}" class="split-preview__iframe"></iframe>
    </div>

    <!-- Right: Form -->
    <div class="split-form">
      <div class="wizard" id="wizard" data-token="${token}">
        <header class="wizard__header">
          <div class="wizard__brand">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#2D6A4F"/><path d="M12 28L20 12L28 28H12Z" fill="#fff"/></svg>
            <span>AnalisCode</span>
          </div>
          <div class="wizard__progress">
            <div class="wizard__progress-bar" id="progress-bar"></div>
          </div>
          <div class="wizard__step-label" id="step-label">Etapa 1 de ${stepCount}</div>
        </header>

        <main class="wizard__body">
          <div class="wizard__content" id="steps-container"></div>
        </main>

        <footer class="wizard__footer">
          <button class="wiz-btn wiz-btn--outline" id="btn-prev" onclick="prevStep()" disabled>&larr; Voltar</button>
          <button class="wiz-btn wiz-btn--primary" id="btn-next" onclick="nextStep()">Proximo &rarr;</button>
        </footer>
      </div>
    </div>
  </div>

  <!-- Success Screen -->
  <div class="done-page" id="success-screen" style="display:none;">
    <div class="done-card">
      <div class="done-icon" style="background:#D1FAE5; color:#065F46;">&#10003;</div>
      <h2>Informacoes enviadas com sucesso!</h2>
      <p>Recebemos todos os dados. Em breve voce recebera o link para visualizar e aprovar seu site.</p>
    </div>
  </div>

  <script id="schema-data" type="application/json">${schemaJson}</script>
  <script src="/form/form.js"></script>
</body>
</html>`);
  } catch (err) {
    console.error('Form route error:', err);
    res.status(500).send('Erro interno do servidor');
  }
});

module.exports = router;
