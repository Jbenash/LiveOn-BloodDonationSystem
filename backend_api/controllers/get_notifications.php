<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Check if user is logged in and has admin role
$currentUser = getCurrentUser();
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in. Please log in first.']);
    exit();
}

if ($currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Admin role required.']);
    exit();
}

require_once '../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    // Fetch notifications
    $stmt = $pdo->query("SELECT notification_id, user_id, message, type, status, timestamp FROM notifications ORDER BY timestamp DESC LIMIT 50");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get unread count
    $unreadStmt = $pdo->query("SELECT COUNT(*) as unread_count FROM notifications WHERE status = 'unread'");
    $unreadResult = $unreadStmt->fetch(PDO::FETCH_ASSOC);
    $unreadCount = $unreadResult['unread_count'];

    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => $unreadCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch notifications', 'details' => $e->getMessage()]);
}
