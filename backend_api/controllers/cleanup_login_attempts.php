<?php
require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $conn = $db->connect();

    // Clean up login attempts older than 1 hour
    $sql = "DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $deletedCount = $stmt->rowCount();
    echo "Cleaned up $deletedCount old login attempts.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
