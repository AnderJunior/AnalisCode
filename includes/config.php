<?php
/**
 * AnalisCode - Configuration
 */

// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'analiscode');
define('DB_USER', 'root');
define('DB_PASS', '');

// App
define('APP_NAME', 'AnalisCode');
define('APP_URL', 'http://localhost:3000'); // Change to your production URL
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_MAX_TOTAL', 30 * 1024 * 1024); // 30MB per client
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

// Paths
define('BASE_PATH', dirname(__DIR__));
define('TEMPLATES_PATH', BASE_PATH . '/templates');
define('UPLOADS_PATH', BASE_PATH . '/uploads');

// Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
