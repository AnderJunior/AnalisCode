<?php
// Catch all PHP errors as JSON
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://localhost:5174'];
if (in_array($origin, $allowed)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!isAdminLoggedIn()) { http_response_code(401); echo json_encode(['error' => 'Não autenticado']); exit; }

$id = intval($_POST['id'] ?? 0);
if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID do cliente inválido']); exit; }

$db = getDB();
$stmt = $db->prepare("SELECT token FROM clients WHERE id = ?");
$stmt->execute([$id]);
$client = $stmt->fetch();
if (!$client) { http_response_code(404); echo json_encode(['error' => 'Cliente não encontrado']); exit; }

if (empty($_FILES['site_zip']) || $_FILES['site_zip']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo ZIP não recebido']);
    exit;
}

$file = $_FILES['site_zip'];
if (!str_ends_with(strtolower($file['name']), '.zip')) {
    http_response_code(400);
    echo json_encode(['error' => 'Somente arquivos .zip são permitidos']);
    exit;
}

$siteDir = __DIR__ . '/../sites/' . $client['token'];

// Remove previous extracted site
if (is_dir($siteDir)) {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($siteDir, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) {
        $f->isDir() ? rmdir($f->getPathname()) : unlink($f->getPathname());
    }
    rmdir($siteDir);
}
mkdir($siteDir, 0755, true);

$zip = new ZipArchive();
if ($zip->open($file['tmp_name']) !== true) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao abrir o ZIP']);
    exit;
}

// Extract — strip top-level folder if all files are inside one
$topFolders = [];
for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = $zip->getNameIndex($i);
    $parts = explode('/', $name);
    if ($parts[0]) $topFolders[$parts[0]] = true;
}
$stripPrefix = '';
if (count($topFolders) === 1) {
    $folder = array_key_first($topFolders);
    // Check if it's really a folder (not a file)
    $stat = $zip->statName($folder . '/');
    if ($stat !== false) $stripPrefix = $folder . '/';
}

for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = $zip->getNameIndex($i);
    $relative = $stripPrefix ? substr($name, strlen($stripPrefix)) : $name;
    if ($relative === '' || $relative === false) continue;

    $dest = $siteDir . '/' . $relative;
    if (str_ends_with($name, '/')) {
        if (!is_dir($dest)) mkdir($dest, 0755, true);
    } else {
        $dir = dirname($dest);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($dest, $zip->getFromIndex($i));
    }
}
$zip->close();

// Check index.html exists
if (!file_exists($siteDir . '/index.html')) {
    echo json_encode(['success' => true, 'warning' => 'ZIP extraído mas index.html não encontrado', 'url' => '/sites/' . $client['token'] . '/']);
    exit;
}

// Save record in revisions
$db->prepare("INSERT INTO revisions (client_id, type, message) VALUES (?, 'publish', 'Site personalizado enviado pelo admin')")
    ->execute([$id]);

echo json_encode(['success' => true, 'url' => '/sites/' . $client['token'] . '/index.html']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
