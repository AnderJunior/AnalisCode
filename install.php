<?php
/**
 * AnalisCode - Database Installer
 * Run this file once to create the database tables.
 * DELETE THIS FILE after installation for security.
 */

require_once __DIR__ . '/includes/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // Templates table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `templates` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `slug` VARCHAR(50) NOT NULL UNIQUE,
        `name` VARCHAR(100) NOT NULL,
        `niche` VARCHAR(50) NOT NULL,
        `thumbnail` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Clients table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `clients` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `token` VARCHAR(32) NOT NULL UNIQUE,
        `review_token` VARCHAR(32) NOT NULL UNIQUE,
        `slug` VARCHAR(50) DEFAULT NULL UNIQUE,
        `template_id` INT NOT NULL,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) DEFAULT NULL,
        `phone` VARCHAR(20) DEFAULT NULL,
        `status` ENUM(
            'formulario_pendente',
            'formulario_preenchido',
            'em_edicao',
            'aguardando_aprovacao',
            'alteracao_solicitada',
            'aprovado',
            'publicado'
        ) NOT NULL DEFAULT 'formulario_pendente',
        `form_data` JSON DEFAULT NULL,
        `site_data` JSON DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Revisions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `revisions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `client_id` INT NOT NULL,
        `type` ENUM('submit', 'revision_request', 'approval') NOT NULL,
        `message` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Uploads table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `uploads` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `client_token` VARCHAR(32) NOT NULL,
        `field_key` VARCHAR(100) NOT NULL,
        `filename` VARCHAR(255) NOT NULL,
        `original_name` VARCHAR(255) NOT NULL,
        `file_size` INT NOT NULL DEFAULT 0,
        `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insert default nutricionista template
    $stmt = $pdo->prepare("INSERT IGNORE INTO `templates` (`slug`, `name`, `niche`, `thumbnail`) VALUES (?, ?, ?, ?)");
    $stmt->execute(['nutricionista', 'Site para Nutricionistas', 'saude', 'templates/nutricionista/thumbnail.png']);

    // Create admin user table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `admins` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(50) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insert default admin (password: admin123 - CHANGE THIS!)
    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO `admins` (`username`, `password`) VALUES (?, ?)");
    $stmt->execute(['admin', $hash]);

    echo "<h1 style='color: green; font-family: sans-serif;'>Instalacao concluida com sucesso!</h1>";
    echo "<p style='font-family: sans-serif;'>Tabelas criadas no banco <strong>" . DB_NAME . "</strong></p>";
    echo "<ul style='font-family: sans-serif;'>";
    echo "<li>templates</li><li>clients</li><li>revisions</li><li>uploads</li><li>admins</li>";
    echo "</ul>";
    echo "<p style='color: red; font-family: sans-serif;'><strong>IMPORTANTE:</strong> Delete este arquivo (install.php) apos a instalacao!</p>";
    echo "<p style='font-family: sans-serif;'><a href='admin/'>Acessar Painel Admin</a> (usuario: admin, senha: admin123)</p>";

} catch (PDOException $e) {
    echo "<h1 style='color: red; font-family: sans-serif;'>Erro na instalacao</h1>";
    echo "<p style='font-family: sans-serif;'>" . htmlspecialchars($e->getMessage()) . "</p>";
}
