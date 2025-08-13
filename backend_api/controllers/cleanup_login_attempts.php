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
    
    // Log the cleanup operation
    $logMessage = date('Y-m-d H:i:s') . " - Cleaned up $deletedCount old login attempts.\n";
    file_put_contents(__DIR__ . '/../logs/cleanup.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    echo "Cleaned up $deletedCount old login attempts.\n";
    
    // Also clean up attempts older than 10 minutes for better performance
    $sql2 = "DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 10 MINUTE)";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->execute();
    
    $deletedCount2 = $stmt2->rowCount();
    if ($deletedCount2 > 0) {
        $logMessage2 = date('Y-m-d H:i:s') . " - Cleaned up additional $deletedCount2 attempts older than 10 minutes.\n";
        file_put_contents(__DIR__ . '/../logs/cleanup.log', $logMessage2, FILE_APPEND | LOCK_EX);
        echo "Cleaned up additional $deletedCount2 attempts older than 10 minutes.\n";
    }
    
} catch (PDOException $e) {
    $errorMessage = date('Y-m-d H:i:s') . " - Error in cleanup: " . $e->getMessage() . "\n";
    file_put_contents(__DIR__ . '/../logs/cleanup.log', $errorMessage, FILE_APPEND | LOCK_EX);
    echo "Error: " . $e->getMessage() . "\n";
}
