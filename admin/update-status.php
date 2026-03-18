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

$clientId = (int)($_POST['client_id'] ?? 0);
$newStatus = $_POST['status'] ?? '';

$validStatuses = ['em_edicao', 'aguardando_aprovacao', 'publicado'];
if (!in_array($newStatus, $validStatuses) || $clientId < 1) {
    header('Location: index.php');
    exit;
}

$db = getDB();
$stmt = $db->prepare("UPDATE clients SET status = ? WHERE id = ?");
$stmt->execute([$newStatus, $clientId]);

header('Location: client.php?id=' . $clientId);
exit;
