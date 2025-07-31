<?php
header('Content-Type: application/json');
// Allow both development ports
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'http://localhost:5173' || $origin === 'http://localhost:5174') {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
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
