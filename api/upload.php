<?php
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$token = $_POST['token'] ?? '';
$fieldKey = $_POST['field_key'] ?? '';

if (empty($token) || empty($fieldKey) || !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token, field_key, or file']);
    exit;
}

$db = getDB();
$stmt = $db->prepare("SELECT id FROM clients WHERE token = ?");
$stmt->execute([$token]);
if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Client not found']);
    exit;
}

$file = $_FILES['file'];

// Validate file
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload failed']);
    exit;
}

if ($file['size'] > UPLOAD_MAX_SIZE) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Max 2MB.']);
    exit;
}

// Validate MIME type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, UPLOAD_ALLOWED_TYPES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, WebP, AVIF']);
    exit;
}

// Validate it's actually an image
$imageInfo = getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode(['error' => 'File is not a valid image']);
    exit;
}

// Create upload directory
$uploadDir = UPLOADS_PATH . '/' . $token;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate filename
$ext = match($mimeType) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
    default => 'jpg'
};

$safeKey = preg_replace('/[^a-z0-9_-]/', '_', strtolower($fieldKey));
$filename = $safeKey . '_' . time() . '.' . $ext;
$destination = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

// Record upload
$stmt = $db->prepare("INSERT INTO uploads (client_token, field_key, filename, original_name, file_size) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$token, $fieldKey, $filename, $file['name'], $file['size']]);

$url = 'uploads/' . $token . '/' . $filename;
echo json_encode(['success' => true, 'url' => $url]);
