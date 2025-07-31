<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/db_connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $message = trim($input['message'] ?? '');
    $type = $input['type'] ?? 'admin_contact';

    if (!$name || !$email || !$subject || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }

    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Generate unique feedback ID
    $feedbackId = 'FB' . substr(uniqid(), -8);

    // Insert admin contact message
    $query = "INSERT INTO feedback (feedback_id, name, email, subject, message, type, status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, 'unread', NOW())";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$feedbackId, $name, $email, $subject, $message, $type]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Message sent successfully! Admin will contact you soon.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to send message. Please try again.'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
