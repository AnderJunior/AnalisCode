<?php
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? '';
$action = $input['action'] ?? '';
$message = $input['message'] ?? '';

if (empty($token) || !in_array($action, ['approve', 'request_revision'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token or invalid action']);
    exit;
}

$db = getDB();
// Accept both regular token and review_token
$stmt = $db->prepare("SELECT id, status FROM clients WHERE token = ? OR review_token = ?");
$stmt->execute([$token, $token]);
$client = $stmt->fetch();

if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Client not found']);
    exit;
}

if ($client['status'] !== 'aguardando_aprovacao') {
    http_response_code(400);
    echo json_encode(['error' => 'Not in reviewable state']);
    exit;
}

if ($action === 'approve') {
    $stmt = $db->prepare("UPDATE clients SET status = 'aprovado', updated_at = NOW() WHERE id = ?");
    $stmt->execute([$client['id']]);

    $stmt = $db->prepare("INSERT INTO revisions (client_id, type, message) VALUES (?, 'approval', 'Site aprovado pelo cliente')");
    $stmt->execute([$client['id']]);
} else {
    $stmt = $db->prepare("UPDATE clients SET status = 'alteracao_solicitada', updated_at = NOW() WHERE id = ?");
    $stmt->execute([$client['id']]);

    $stmt = $db->prepare("INSERT INTO revisions (client_id, type, message) VALUES (?, 'revision_request', ?)");
    $stmt->execute([$client['id'], $message]);
}

echo json_encode(['success' => true]);
