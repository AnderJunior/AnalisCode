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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = generateCSRFToken();
    echo json_encode(['authenticated' => isAdminLoggedIn(), 'csrf_token' => $token]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'login') {
        $csrf = $data['csrf_token'] ?? '';
        if (!validateCSRF($csrf)) { http_response_code(403); echo json_encode(['error' => 'Token inválido']); exit; }
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';
        if (loginAdmin($username, $password)) {
            $newToken = generateCSRFToken();
            echo json_encode(['success' => true, 'csrf_token' => $newToken]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Usuário ou senha incorretos']);
        }
        exit;
    }

    if ($action === 'logout') {
        logoutAdmin();
        echo json_encode(['success' => true]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
