<?php
require_once __DIR__ . '/../config/db_connection.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("UPDATE notifications SET status = 'read' WHERE status = 'unread'");
    $stmt->execute();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to mark notifications as read', 'details' => $e->getMessage()]);
}
