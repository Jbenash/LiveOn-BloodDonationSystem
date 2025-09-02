<?php
header('Content-Type: application/json');
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
    $input = json_decode(file_get_contents('php://input'), true);
    $messageId = $input['message_id'] ?? null;

    if (!$messageId) {
        http_response_code(400);
        echo json_encode(['error' => 'Message ID is required']);
        exit;
    }

    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Mark message as read (approve the feedback)
    $query = "UPDATE feedback 
              SET approved = 1 
              WHERE feedback_id = ?";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$messageId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Message marked as read']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Message not found or already read']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
