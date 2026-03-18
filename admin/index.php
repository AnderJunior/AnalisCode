<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

$db = getDB();

// Stats
$totalClients = $db->query("SELECT COUNT(*) FROM clients")->fetchColumn();
$pendingForms = $db->query("SELECT COUNT(*) FROM clients WHERE status = 'formulario_pendente'")->fetchColumn();
$filledForms = $db->query("SELECT COUNT(*) FROM clients WHERE status = 'formulario_preenchido'")->fetchColumn();
$published = $db->query("SELECT COUNT(*) FROM clients WHERE status = 'publicado'")->fetchColumn();

// Clients list
$clients = $db->query("
    SELECT c.*, t.name as template_name, t.slug as template_slug
    FROM clients c
    JOIN templates t ON c.template_id = t.id
    ORDER BY c.updated_at DESC
")->fetchAll();

// Templates for modal
$templates = $db->query("SELECT * FROM templates ORDER BY name")->fetchAll();

$csrf = generateCSRFToken();

// Status labels and badges
$statusMap = [
    'formulario_pendente' => ['label' => 'Formulario Pendente', 'class' => 'badge--pending'],
    'formulario_preenchido' => ['label' => 'Formulario Preenchido', 'class' => 'badge--filled'],
    'em_edicao' => ['label' => 'Em Edicao', 'class' => 'badge--editing'],
    'aguardando_aprovacao' => ['label' => 'Aguardando Aprovacao', 'class' => 'badge--review'],
    'alteracao_solicitada' => ['label' => 'Alteracao Solicitada', 'class' => 'badge--revision'],
    'aprovado' => ['label' => 'Aprovado', 'class' => 'badge--approved'],
    'publicado' => ['label' => 'Publicado', 'class' => 'badge--published'],
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?= APP_NAME ?> Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="admin.css">
</head>
<body>
<div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar__logo">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#52B788"/><path d="M12 28L20 12L28 28H12Z" fill="#fff"/></svg>
            <h2><?= APP_NAME ?></h2>
        </div>
        <ul class="sidebar__nav">
            <li><a href="index.php" class="sidebar__link active">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
                Dashboard
            </a></li>
            <li><a href="logout.php" class="sidebar__link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
                Sair
            </a></li>
        </ul>
    </aside>

    <!-- Main Content -->
    <main class="main">
        <div class="main__header">
            <div>
                <h1 class="main__title">Dashboard</h1>
                <p class="main__subtitle">Gerencie seus clientes e projetos</p>
            </div>
            <button class="btn btn--primary" onclick="openModal('new-client-modal')">+ Novo Cliente</button>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <p class="stat-card__label">Total de Clientes</p>
                <p class="stat-card__value"><?= $totalClients ?></p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Formularios Pendentes</p>
                <p class="stat-card__value"><?= $pendingForms ?></p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Prontos para Editar</p>
                <p class="stat-card__value"><?= $filledForms ?></p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Publicados</p>
                <p class="stat-card__value"><?= $published ?></p>
            </div>
        </div>

        <!-- Clients Table -->
        <div class="card">
            <div class="card__header">
                <h3 class="card__title">Clientes</h3>
            </div>
            <?php if (empty($clients)): ?>
                <div class="empty-state">
                    <div class="empty-state__icon">&#128203;</div>
                    <h3 class="empty-state__title">Nenhum cliente cadastrado</h3>
                    <p class="empty-state__text">Cadastre seu primeiro cliente para comecar.</p>
                    <button class="btn btn--primary" onclick="openModal('new-client-modal')">+ Novo Cliente</button>
                </div>
            <?php else: ?>
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Template</th>
                                <th>Status</th>
                                <th>Atualizado</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($clients as $client): ?>
                                <?php $status = $statusMap[$client['status']] ?? ['label' => $client['status'], 'class' => '']; ?>
                                <tr>
                                    <td>
                                        <strong><?= htmlspecialchars($client['name']) ?></strong>
                                        <?php if ($client['email']): ?>
                                            <br><small style="color: var(--text-secondary)"><?= htmlspecialchars($client['email']) ?></small>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= htmlspecialchars($client['template_name']) ?></td>
                                    <td><span class="badge <?= $status['class'] ?>"><?= $status['label'] ?></span></td>
                                    <td><small><?= date('d/m/Y H:i', strtotime($client['updated_at'])) ?></small></td>
                                    <td>
                                        <a href="client.php?id=<?= $client['id'] ?>" class="btn btn--outline btn--sm">Ver</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </main>
</div>

<!-- New Client Modal -->
<div class="modal-overlay" id="new-client-modal">
    <div class="modal">
        <div class="modal__header">
            <h3 class="modal__title">Novo Cliente</h3>
            <button class="modal__close" onclick="closeModal('new-client-modal')">&times;</button>
        </div>
        <form method="POST" action="create-client.php">
            <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
            <div class="modal__body">
                <div class="form-group">
                    <label for="client_name">Nome do Cliente / Negocio *</label>
                    <input type="text" id="client_name" name="name" required placeholder="Ex: Dra. Camila Rodrigues">
                </div>
                <div class="form-group">
                    <label for="client_email">Email</label>
                    <input type="email" id="client_email" name="email" placeholder="email@exemplo.com">
                </div>
                <div class="form-group">
                    <label for="client_phone">Telefone / WhatsApp</label>
                    <input type="text" id="client_phone" name="phone" placeholder="(27) 99999-9999">
                </div>
                <div class="form-group">
                    <label for="template_id">Template *</label>
                    <select id="template_id" name="template_id" required>
                        <option value="">Selecione um template</option>
                        <?php foreach ($templates as $tpl): ?>
                            <option value="<?= $tpl['id'] ?>"><?= htmlspecialchars($tpl['name']) ?> (<?= $tpl['niche'] ?>)</option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            <div class="modal__footer">
                <button type="button" class="btn btn--outline" onclick="closeModal('new-client-modal')">Cancelar</button>
                <button type="submit" class="btn btn--primary">Criar Cliente</button>
            </div>
        </form>
    </div>
</div>

<script>
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
});
</script>
</body>
</html>
