<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!isAdminLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Não autenticado']); exit; }

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT c.*, t.name as template_name, t.niche FROM clients c JOIN templates t ON c.template_id = t.id ORDER BY c.created_at DESC");
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stats = ['total'=>0,'formulario_pendente'=>0,'formulario_preenchido'=>0,'em_edicao'=>0,'aguardando_aprovacao'=>0,'alteracao_solicitada'=>0,'aprovado'=>0,'publicado'=>0];
        foreach ($clients as $c) { $stats['total']++; if (isset($stats[$c['status']])) $stats[$c['status']]++; }
        echo json_encode(['clients' => $clients, 'stats' => $stats]);
        exit;
    }

    if ($action === 'detail') {
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT c.*, t.name as template_name, t.slug as template_slug, t.niche FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.id = ?");
        $stmt->execute([$id]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$client) { http_response_code(404); echo json_encode(['error' => 'Cliente não encontrado']); exit; }
        $client['form_data'] = $client['form_data'] ? json_decode($client['form_data'], true) : null;
        $client['site_data'] = $client['site_data'] ? json_decode($client['site_data'], true) : null;
        $revStmt = $pdo->prepare("SELECT * FROM revisions WHERE client_id = ? ORDER BY created_at DESC");
        $revStmt->execute([$id]);
        $revisions = $revStmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['client' => $client, 'revisions' => $revisions]);
        exit;
    }

    if ($action === 'templates') {
        $stmt = $pdo->query("SELECT * FROM templates ORDER BY name");
        echo json_encode(['templates' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    $csrf = $data['csrf_token'] ?? '';
    if (!validateCSRF($csrf)) { http_response_code(403); echo json_encode(['error' => 'Token CSRF inválido']); exit; }

    if ($action === 'create') {
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $template_id = intval($data['template_id'] ?? 1);
        if (!$name) { http_response_code(400); echo json_encode(['error' => 'Nome é obrigatório']); exit; }
        $token = generateToken();
        $review_token = generateToken();
        $stmt = $pdo->prepare("INSERT INTO clients (token, review_token, template_id, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$token, $review_token, $template_id, $name, $email, $phone]);
        $id = $pdo->lastInsertId();
        $uploadDir = UPLOADS_PATH . '/' . $token;
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $stmt = $pdo->prepare("SELECT c.*, t.name as template_name FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.id = ?");
        $stmt->execute([$id]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'client' => $client]);
        exit;
    }

    if ($action === 'update_status') {
        $id = intval($data['id'] ?? 0);
        $status = $data['status'] ?? '';
        $validStatuses = ['formulario_pendente','formulario_preenchido','em_edicao','aguardando_aprovacao','alteracao_solicitada','aprovado','publicado'];
        if (!in_array($status, $validStatuses)) { http_response_code(400); echo json_encode(['error' => 'Status inválido']); exit; }
        $pdo->prepare("UPDATE clients SET status = ? WHERE id = ?")->execute([$status, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'save_site_data') {
        $id = intval($data['id'] ?? 0);
        $site_data = $data['site_data'] ?? null;
        if (!$id || $site_data === null) { http_response_code(400); echo json_encode(['error' => 'Dados inválidos']); exit; }
        $pdo->prepare("UPDATE clients SET site_data = ?, updated_at = NOW() WHERE id = ?")
            ->execute([json_encode($site_data, JSON_UNESCAPED_UNICODE), $id]);
        $pdo->prepare("INSERT INTO revisions (client_id, type, message) VALUES (?, 'publish', 'Atualização publicada pelo admin')")
            ->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
