<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Debug session
error_log("Session data: " . print_r($_SESSION, true));

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    error_log("Unauthorized access - user_id: " . ($_SESSION['user_id'] ?? 'not set') . ", role: " . ($_SESSION['role'] ?? 'not set'));
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

require_once '../config/db_connection.php';

try {
    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Fetch admin contact messages from feedback table
    $query = "SELECT 
                feedback_id as id,
                name,
                email,
                subject,
                message,
                created_at,
                status
              FROM feedback 
              WHERE type = 'admin_contact' 
              ORDER BY created_at DESC 
              LIMIT 50";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get unread count
    $unreadQuery = "SELECT COUNT(*) as unread_count 
                    FROM feedback 
                    WHERE type = 'admin_contact' AND status = 'unread'";
    $unreadStmt = $pdo->prepare($unreadQuery);
    $unreadStmt->execute();
    $unreadResult = $unreadStmt->fetch(PDO::FETCH_ASSOC);
    $unreadCount = $unreadResult['unread_count'];

    error_log("Found " . count($messages) . " messages, " . $unreadCount . " unread");

    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'unread_count' => $unreadCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
