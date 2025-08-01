<?php
require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $conn = $db->connect();

    // Create login_attempts table
    $sql = "CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_time (email, attempt_time),
        INDEX idx_ip_time (ip_address, attempt_time)
    )";

    $conn->exec($sql);
    echo "Login attempts table created successfully!\n";

    // Clean up old attempts (older than 1 hour)
    $cleanupSql = "DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)";
    $conn->exec($cleanupSql);
    echo "Old login attempts cleaned up!\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
