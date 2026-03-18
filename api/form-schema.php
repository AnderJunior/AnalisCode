<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$token = $_GET['token'] ?? '';
if (!$token) { http_response_code(400); echo json_encode(['error' => 'Token obrigatório']); exit; }

$pdo = getDB();
$stmt = $pdo->prepare("SELECT c.*, t.slug as template_slug, t.name as template_name FROM clients c JOIN templates t ON c.template_id = t.id WHERE c.token = ?");
$stmt->execute([$token]);
$client = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$client) { http_response_code(404); echo json_encode(['error' => 'Token inválido']); exit; }

$schemaPath = BASE_PATH . '/templates/' . $client['template_slug'] . '/schema.json';
if (!file_exists($schemaPath)) { http_response_code(500); echo json_encode(['error' => 'Schema não encontrado']); exit; }

$schema = json_decode(file_get_contents($schemaPath), true);

$upStmt = $pdo->prepare("SELECT * FROM uploads WHERE client_token = ?");
$upStmt->execute([$token]);
$uploadsMap = [];
foreach ($upStmt->fetchAll(PDO::FETCH_ASSOC) as $upload) {
    $uploadsMap[$upload['field_key']] = 'uploads/' . $token . '/' . $upload['filename'];
}

echo json_encode([
    'client' => ['name' => $client['name'], 'status' => $client['status'], 'template_name' => $client['template_name']],
    'schema' => $schema,
    'form_data' => $client['form_data'] ? json_decode($client['form_data'], true) : null,
    'uploads' => $uploadsMap,
]);
