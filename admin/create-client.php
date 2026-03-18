<?php
require_once __DIR__ . '/../includes/auth.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

if (!validateCSRF($_POST['csrf_token'] ?? '')) {
    die('Invalid CSRF token');
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$templateId = (int)($_POST['template_id'] ?? 0);

if (empty($name) || $templateId < 1) {
    header('Location: index.php?error=missing_fields');
    exit;
}

$db = getDB();

// Verify template exists
$stmt = $db->prepare("SELECT id FROM templates WHERE id = ?");
$stmt->execute([$templateId]);
if (!$stmt->fetch()) {
    header('Location: index.php?error=invalid_template');
    exit;
}

$token = generateToken();
$reviewToken = generateToken();

$stmt = $db->prepare("INSERT INTO clients (token, review_token, template_id, name, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'formulario_pendente')");
$stmt->execute([$token, $reviewToken, $templateId, $name, $email ?: null, $phone ?: null]);

$clientId = $db->lastInsertId();

// Create upload directory
$uploadDir = UPLOADS_PATH . '/' . $token;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

header('Location: client.php?id=' . $clientId . '&created=1');
exit;
