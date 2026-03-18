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
$data = $input['data'] ?? [];

if (empty($token) || empty($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token or data']);
    exit;
}

$db = getDB();

$stmt = $db->prepare("SELECT id, status FROM clients WHERE token = ?");
$stmt->execute([$token]);
$client = $stmt->fetch();

if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Client not found']);
    exit;
}

$editableStatuses = ['formulario_pendente', 'formulario_preenchido'];
if (!in_array($client['status'], $editableStatuses)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formulário não pode ser editado neste momento']);
    exit;
}

$isEdit = $client['status'] === 'formulario_preenchido';

// Save form data and update status
$stmt = $db->prepare("UPDATE clients SET form_data = ?, status = 'formulario_preenchido', updated_at = NOW() WHERE id = ?");
$stmt->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $client['id']]);

// Create revision record
$msg = $isEdit ? 'Formulario atualizado pelo cliente' : 'Formulario preenchido pelo cliente';
$stmt = $db->prepare("INSERT INTO revisions (client_id, type, message) VALUES (?, 'submit', ?)");
$stmt->execute([$client['id'], $msg]);

echo json_encode(['success' => true]);
