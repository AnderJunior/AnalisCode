<?php
require_once __DIR__ . '/../includes/db.php';

$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(404);
    die('Link invalido.');
}

$db = getDB();
$stmt = $db->prepare("
    SELECT c.*, t.name as template_name, t.slug as template_slug
    FROM clients c
    JOIN templates t ON c.template_id = t.id
    WHERE c.review_token = ?
");
$stmt->execute([$token]);
$client = $stmt->fetch();

if (!$client) {
    http_response_code(404);
    die('Link invalido.');
}

// Get revision history
$stmt = $db->prepare("SELECT * FROM revisions WHERE client_id = ? ORDER BY created_at DESC LIMIT 10");
$stmt->execute([$client['id']]);
$revisions = $stmt->fetchAll();

$isReviewable = in_array($client['status'], ['aguardando_aprovacao']);
$isApproved = in_array($client['status'], ['aprovado', 'publicado']);
$previewUrl = APP_URL . '/api/preview.php?token=' . $client['token'];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aprovacao do Site - <?= htmlspecialchars($client['name']) ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2D6A4F;
            --primary-dark: #1B4332;
            --primary-light: #52B788;
            --primary-lighter: #D8F3DC;
            --danger: #DC3545;
            --text: #1E1E1E;
            --text-secondary: #6B7280;
            --bg: #F9FAFB;
            --bg-card: #FFFFFF;
            --border: #E5E7EB;
            --radius: 16px;
            --font: 'Inter', -apple-system, sans-serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: var(--font); background: var(--bg); color: var(--text); }

        .header {
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header__brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header__brand svg { width: 32px; height: 32px; }
        .header__brand h1 { font-size: 16px; font-weight: 600; }

        .header__status {
            display: inline-flex;
            align-items: center;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .status--review { background: #FEF3C7; color: #92400E; }
        .status--approved { background: #D1FAE5; color: #065F46; }
        .status--revision { background: #FED7AA; color: #9A3412; }

        .greeting {
            max-width: 800px;
            margin: 32px auto;
            padding: 0 24px;
            text-align: center;
        }

        .greeting h2 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .greeting p {
            font-size: 15px;
            color: var(--text-secondary);
        }

        .preview-frame {
            max-width: 1200px;
            margin: 24px auto;
            padding: 0 24px;
        }

        .preview-frame iframe {
            width: 100%;
            height: 70vh;
            border: 2px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-card);
        }

        .actions {
            max-width: 800px;
            margin: 32px auto;
            padding: 0 24px 60px;
        }

        .actions__buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-bottom: 24px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-family: var(--font);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn--approve { background: var(--primary); color: #fff; }
        .btn--approve:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45,106,79,0.3); }
        .btn--revision { background: #FEF3C7; color: #92400E; border: 1.5px solid #F59E0B; }
        .btn--revision:hover { background: #FDE68A; }

        .revision-form {
            display: none;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-top: 24px;
        }

        .revision-form.active { display: block; }

        .revision-form textarea {
            width: 100%;
            min-height: 120px;
            padding: 12px 16px;
            border: 1.5px solid var(--border);
            border-radius: 10px;
            font-family: var(--font);
            font-size: 14px;
            resize: vertical;
            margin-bottom: 16px;
        }

        .revision-form textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(45,106,79,0.1);
        }

        .success-msg {
            display: none;
            text-align: center;
            padding: 40px;
        }

        .success-msg.active { display: block; }
        .success-msg h3 { font-size: 20px; margin-bottom: 8px; color: var(--primary); }
        .success-msg p { color: var(--text-secondary); }

        .already-done {
            max-width: 500px;
            margin: 80px auto;
            text-align: center;
            padding: 48px 24px;
            background: var(--bg-card);
            border-radius: var(--radius);
            border: 1px solid var(--border);
        }

        .already-done h2 { font-size: 22px; margin-bottom: 8px; }
        .already-done p { color: var(--text-secondary); font-size: 15px; }

        @media (max-width: 640px) {
            .actions__buttons { flex-direction: column; }
            .btn { width: 100%; justify-content: center; }
            .preview-frame iframe { height: 50vh; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header__brand">
            <svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#2D6A4F"/><path d="M12 28L20 12L28 28H12Z" fill="#fff"/></svg>
            <h1>Aprovacao do Site</h1>
        </div>
        <?php if ($isReviewable): ?>
            <span class="header__status status--review">Aguardando sua Aprovacao</span>
        <?php elseif ($isApproved): ?>
            <span class="header__status status--approved">Aprovado</span>
        <?php endif; ?>
    </header>

    <?php if ($isApproved): ?>
        <div class="already-done">
            <h2>Site Aprovado!</h2>
            <p>Voce ja aprovou este site. Em breve ele estara publicado.</p>
        </div>
    <?php elseif (!$isReviewable): ?>
        <div class="already-done">
            <h2>Aguarde</h2>
            <p>O site ainda esta sendo preparado. Voce recebera um aviso quando estiver pronto para revisao.</p>
        </div>
    <?php else: ?>
        <div class="greeting">
            <h2>Ola, <?= htmlspecialchars(explode(' ', $client['name'])[0]) ?>!</h2>
            <p>Seu site esta pronto para revisao. Confira abaixo e nos diga o que achou.</p>
        </div>

        <div class="preview-frame">
            <iframe src="<?= htmlspecialchars($previewUrl) ?>" title="Preview do site"></iframe>
        </div>

        <div class="actions" id="actions-area">
            <div class="actions__buttons" id="action-buttons">
                <button class="btn btn--approve" onclick="approve()">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Aprovar Site
                </button>
                <button class="btn btn--revision" onclick="showRevisionForm()">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                    Solicitar Alteracoes
                </button>
            </div>

            <div class="revision-form" id="revision-form">
                <h4 style="margin-bottom: 12px; font-size: 16px;">O que gostaria de alterar?</h4>
                <textarea id="revision-message" placeholder="Descreva as alteracoes que gostaria..."></textarea>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn--revision" onclick="submitRevision()" style="flex: 1; justify-content: center;">Enviar Solicitacao</button>
                    <button class="btn" onclick="hideRevisionForm()" style="background: var(--bg); flex: 0;">Cancelar</button>
                </div>
            </div>

            <div class="success-msg" id="success-approve">
                <h3>Site Aprovado com Sucesso!</h3>
                <p>Obrigado! Em breve seu site estara no ar.</p>
            </div>

            <div class="success-msg" id="success-revision">
                <h3>Solicitacao Enviada!</h3>
                <p>Recebemos seus comentarios e em breve faremos as alteracoes.</p>
            </div>
        </div>

        <script>
        const reviewToken = '<?= htmlspecialchars($client['review_token']) ?>';
        const apiUrl = '<?= APP_URL ?>/api/approve.php';

        function showRevisionForm() {
            document.getElementById('revision-form').classList.add('active');
        }

        function hideRevisionForm() {
            document.getElementById('revision-form').classList.remove('active');
        }

        async function approve() {
            if (!confirm('Tem certeza que deseja aprovar o site?')) return;

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: reviewToken, action: 'approve' })
            });

            if (res.ok) {
                document.getElementById('action-buttons').style.display = 'none';
                document.getElementById('revision-form').classList.remove('active');
                document.getElementById('success-approve').classList.add('active');
            }
        }

        async function submitRevision() {
            const message = document.getElementById('revision-message').value.trim();
            if (!message) {
                alert('Por favor, descreva as alteracoes que deseja.');
                return;
            }

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: reviewToken, action: 'request_revision', message })
            });

            if (res.ok) {
                document.getElementById('action-buttons').style.display = 'none';
                document.getElementById('revision-form').classList.remove('active');
                document.getElementById('success-revision').classList.add('active');
            }
        }
        </script>
    <?php endif; ?>
</body>
</html>
