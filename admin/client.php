<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

$db = getDB();
$clientId = (int)($_GET['id'] ?? 0);
$created = isset($_GET['created']);

$stmt = $db->prepare("
    SELECT c.*, t.name as template_name, t.slug as template_slug
    FROM clients c
    JOIN templates t ON c.template_id = t.id
    WHERE c.id = ?
");
$stmt->execute([$clientId]);
$client = $stmt->fetch();

if (!$client) {
    header('Location: index.php');
    exit;
}

// Get revisions
$stmt = $db->prepare("SELECT * FROM revisions WHERE client_id = ? ORDER BY created_at DESC");
$stmt->execute([$clientId]);
$revisions = $stmt->fetchAll();

// Get uploads
$stmt = $db->prepare("SELECT * FROM uploads WHERE client_token = ? ORDER BY uploaded_at DESC");
$stmt->execute([$client['token']]);
$uploads = $stmt->fetchAll();

$formData = $client['form_data'] ? json_decode($client['form_data'], true) : [];

$csrf = generateCSRFToken();

$statusMap = [
    'formulario_pendente' => ['label' => 'Formulario Pendente', 'class' => 'badge--pending'],
    'formulario_preenchido' => ['label' => 'Formulario Preenchido', 'class' => 'badge--filled'],
    'em_edicao' => ['label' => 'Em Edicao', 'class' => 'badge--editing'],
    'aguardando_aprovacao' => ['label' => 'Aguardando Aprovacao', 'class' => 'badge--review'],
    'alteracao_solicitada' => ['label' => 'Alteracao Solicitada', 'class' => 'badge--revision'],
    'aprovado' => ['label' => 'Aprovado', 'class' => 'badge--approved'],
    'publicado' => ['label' => 'Publicado', 'class' => 'badge--published'],
];
$status = $statusMap[$client['status']] ?? ['label' => $client['status'], 'class' => ''];

$formUrl = APP_URL . '/form/?token=' . $client['token'];
$reviewUrl = APP_URL . '/review/?token=' . $client['review_token'];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($client['name']) ?> - <?= APP_NAME ?> Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="admin.css">
</head>
<body>
<div class="layout">
    <aside class="sidebar">
        <div class="sidebar__logo">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#52B788"/><path d="M12 28L20 12L28 28H12Z" fill="#fff"/></svg>
            <h2><?= APP_NAME ?></h2>
        </div>
        <ul class="sidebar__nav">
            <li><a href="index.php" class="sidebar__link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
                Dashboard
            </a></li>
            <li><a href="logout.php" class="sidebar__link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
                Sair
            </a></li>
        </ul>
    </aside>

    <main class="main">
        <div class="main__header">
            <div>
                <a href="index.php" style="font-size: 13px; color: var(--text-secondary);">&larr; Voltar ao Dashboard</a>
                <h1 class="main__title"><?= htmlspecialchars($client['name']) ?></h1>
                <p class="main__subtitle">Template: <?= htmlspecialchars($client['template_name']) ?></p>
            </div>
            <span class="badge <?= $status['class'] ?>" style="font-size: 14px; padding: 6px 16px;"><?= $status['label'] ?></span>
        </div>

        <?php if ($created): ?>
            <div class="alert alert--success">
                Cliente criado com sucesso! Copie o link do formulario e envie para o cliente.
            </div>
        <?php endif; ?>

        <!-- Links -->
        <div class="card" style="margin-bottom: 24px;">
            <div class="card__body">
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Link do Formulario (envie para o cliente)</label>
                    <div class="copy-link">
                        <input type="text" value="<?= htmlspecialchars($formUrl) ?>" id="form-url" readonly>
                        <button class="btn btn--outline btn--sm" onclick="copyLink('form-url')">Copiar</button>
                    </div>
                </div>
                <?php if (in_array($client['status'], ['aguardando_aprovacao', 'alteracao_solicitada', 'aprovado', 'publicado'])): ?>
                <div>
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Link de Aprovacao</label>
                    <div class="copy-link">
                        <input type="text" value="<?= htmlspecialchars($reviewUrl) ?>" id="review-url" readonly>
                        <button class="btn btn--outline btn--sm" onclick="copyLink('review-url')">Copiar</button>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Client Info -->
        <div class="card" style="margin-bottom: 24px;">
            <div class="card__header">
                <h3 class="card__title">Informacoes do Cliente</h3>
            </div>
            <div class="card__body">
                <div class="detail-grid">
                    <div class="detail-item">
                        <p class="detail-item__label">Nome</p>
                        <p class="detail-item__value"><?= htmlspecialchars($client['name']) ?></p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-item__label">Email</p>
                        <p class="detail-item__value"><?= htmlspecialchars($client['email'] ?? '-') ?></p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-item__label">Telefone</p>
                        <p class="detail-item__value"><?= htmlspecialchars($client['phone'] ?? '-') ?></p>
                    </div>
                    <div class="detail-item">
                        <p class="detail-item__label">Criado em</p>
                        <p class="detail-item__value"><?= date('d/m/Y H:i', strtotime($client['created_at'])) ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Form Data -->
        <?php if (!empty($formData)): ?>
        <div class="card" style="margin-bottom: 24px;">
            <div class="card__header">
                <h3 class="card__title">Dados do Formulario</h3>
            </div>
            <div class="card__body">
                <?php foreach ($formData as $section => $fields): ?>
                    <h4 style="font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: 12px; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
                        <?= htmlspecialchars(ucfirst(str_replace('_', ' ', $section))) ?>
                    </h4>
                    <?php if (is_array($fields)): ?>
                        <?php foreach ($fields as $key => $value): ?>
                            <div class="detail-item" style="border-bottom: 1px solid var(--border); padding: 8px 0;">
                                <p class="detail-item__label"><?= htmlspecialchars(ucfirst(str_replace('_', ' ', $key))) ?></p>
                                <?php if (is_array($value)): ?>
                                    <pre style="font-size: 13px; background: var(--bg); padding: 8px; border-radius: 6px; overflow-x: auto;"><?= htmlspecialchars(json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
                                <?php elseif (str_starts_with((string)$value, 'uploads/')): ?>
                                    <img src="<?= APP_URL . '/' . htmlspecialchars($value) ?>" style="max-width: 200px; border-radius: 8px; margin-top: 4px;">
                                <?php else: ?>
                                    <p class="detail-item__value"><?= nl2br(htmlspecialchars((string)$value)) ?></p>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p class="detail-item__value"><?= nl2br(htmlspecialchars((string)$fields)) ?></p>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Actions -->
        <div class="card" style="margin-bottom: 24px;">
            <div class="card__header">
                <h3 class="card__title">Acoes</h3>
            </div>
            <div class="card__body" style="display: flex; gap: 12px; flex-wrap: wrap;">
                <?php if ($client['status'] === 'formulario_preenchido'): ?>
                    <form method="POST" action="update-status.php">
                        <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
                        <input type="hidden" name="client_id" value="<?= $client['id'] ?>">
                        <input type="hidden" name="status" value="em_edicao">
                        <button type="submit" class="btn btn--primary">Iniciar Edicao</button>
                    </form>
                <?php endif; ?>

                <?php if (in_array($client['status'], ['em_edicao', 'alteracao_solicitada'])): ?>
                    <form method="POST" action="update-status.php">
                        <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
                        <input type="hidden" name="client_id" value="<?= $client['id'] ?>">
                        <input type="hidden" name="status" value="aguardando_aprovacao">
                        <button type="submit" class="btn btn--primary">Enviar para Aprovacao</button>
                    </form>
                <?php endif; ?>

                <?php if ($client['status'] === 'aprovado'): ?>
                    <form method="POST" action="update-status.php">
                        <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
                        <input type="hidden" name="client_id" value="<?= $client['id'] ?>">
                        <input type="hidden" name="status" value="publicado">
                        <button type="submit" class="btn btn--primary">Publicar Site</button>
                    </form>
                <?php endif; ?>

                <a href="<?= $formUrl ?>" target="_blank" class="btn btn--outline">Ver Formulario</a>
            </div>
        </div>

        <!-- Revisions History -->
        <?php if (!empty($revisions)): ?>
        <div class="card">
            <div class="card__header">
                <h3 class="card__title">Historico</h3>
            </div>
            <div class="card__body">
                <?php foreach ($revisions as $rev): ?>
                    <div style="padding: 12px 0; border-bottom: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span class="badge <?= $rev['type'] === 'approval' ? 'badge--approved' : ($rev['type'] === 'revision_request' ? 'badge--revision' : 'badge--filled') ?>">
                                <?= $rev['type'] === 'approval' ? 'Aprovado' : ($rev['type'] === 'revision_request' ? 'Alteracao Solicitada' : 'Formulario Enviado') ?>
                            </span>
                            <small style="color: var(--text-secondary);"><?= date('d/m/Y H:i', strtotime($rev['created_at'])) ?></small>
                        </div>
                        <?php if ($rev['message']): ?>
                            <p style="font-size: 14px; color: var(--text); margin-top: 8px;"><?= nl2br(htmlspecialchars($rev['message'])) ?></p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
    </main>
</div>

<script>
function copyLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        const btn = input.nextElementSibling;
        btn.textContent = 'Copiado!';
        setTimeout(() => btn.textContent = 'Copiar', 2000);
    });
}
</script>
</body>
</html>
