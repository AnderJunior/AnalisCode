<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/renderer.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    http_response_code(404);
    die('Token not provided');
}

$db = getDB();

// Try form token first, then review token
$stmt = $db->prepare("
    SELECT c.*, t.slug as template_slug
    FROM clients c
    JOIN templates t ON c.template_id = t.id
    WHERE c.token = ? OR c.review_token = ?
");
$stmt->execute([$token, $token]);
$client = $stmt->fetch();

if (!$client) {
    http_response_code(404);
    die('Client not found');
}

// Check for custom uploaded site (zip-based)
$customSite = __DIR__ . '/../sites/' . $client['token'] . '/index.html';
if (file_exists($customSite)) {
    header('Location: /sites/' . $client['token'] . '/index.html');
    exit;
}

// Use site_data if available (edited by dev), otherwise form_data
$data = [];
if ($client['site_data']) {
    $data = json_decode($client['site_data'], true);
} elseif ($client['form_data']) {
    $data = json_decode($client['form_data'], true);
} else {
    // Use default data
    $data = loadDefaultData($client['template_slug']);
}

try {
    $html = renderTemplate($client['template_slug'], $data);
    echo $html;
} catch (RuntimeException $e) {
    http_response_code(500);
    echo 'Error rendering template: ' . htmlspecialchars($e->getMessage());
}
