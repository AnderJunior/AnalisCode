<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/renderer.php';

$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(404);
    die('Link invalido.');
}

$db = getDB();
$stmt = $db->prepare("
    SELECT c.*, t.slug as template_slug, t.name as template_name
    FROM clients c
    JOIN templates t ON c.template_id = t.id
    WHERE c.token = ?
");
$stmt->execute([$token]);
$client = $stmt->fetch();

if (!$client) {
    http_response_code(404);
    die('Link invalido.');
}

$schema = loadSchema($client['template_slug']);
$alreadyFilled = $client['status'] !== 'formulario_pendente';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preencha as informacoes do seu site</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="form.css">
</head>
<body>
    <?php if ($alreadyFilled): ?>
    <div class="done-page">
        <div class="done-card">
            <div class="done-icon">&#10003;</div>
            <h2>Formulario ja enviado!</h2>
            <p>Voce ja preencheu as informacoes do seu site. Aguarde nosso contato para a proxima etapa.</p>
        </div>
    </div>
    <?php else: ?>
    <div class="wizard" id="wizard" data-token="<?= htmlspecialchars($token) ?>">
        <!-- Header -->
        <header class="wizard__header">
            <div class="wizard__brand">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#2D6A4F"/><path d="M12 28L20 12L28 28H12Z" fill="#fff"/></svg>
                <span>Formulario do Site</span>
            </div>
            <div class="wizard__progress">
                <div class="wizard__progress-bar" id="progress-bar"></div>
            </div>
            <div class="wizard__step-label" id="step-label">Etapa 1 de <?= count($schema['steps'] ?? []) ?></div>
        </header>

        <!-- Steps Container -->
        <main class="wizard__body">
            <div class="wizard__content" id="steps-container">
                <!-- Steps rendered by JS -->
            </div>
        </main>

        <!-- Footer -->
        <footer class="wizard__footer">
            <button class="wiz-btn wiz-btn--outline" id="btn-prev" onclick="prevStep()" disabled>
                &larr; Voltar
            </button>
            <button class="wiz-btn wiz-btn--primary" id="btn-next" onclick="nextStep()">
                Proximo &rarr;
            </button>
        </footer>
    </div>

    <!-- Success Screen -->
    <div class="done-page" id="success-screen" style="display:none;">
        <div class="done-card">
            <div class="done-icon" style="background:#D1FAE5; color:#065F46;">&#10003;</div>
            <h2>Informacoes enviadas com sucesso!</h2>
            <p>Recebemos todos os dados. Em breve voce recebera o link para visualizar e aprovar seu site.</p>
        </div>
    </div>

    <script id="schema-data" type="application/json"><?= json_encode($schema, JSON_UNESCAPED_UNICODE) ?></script>
    <script src="form.js"></script>
    <?php endif; ?>
</body>
</html>
