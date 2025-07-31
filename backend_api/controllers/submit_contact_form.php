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
    $requiredFields = ['name', 'email', 'subject', 'message'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Generate unique feedback ID
    $feedbackId = 'FB' . strtoupper(substr(md5(uniqid()), 0, 6));

    // Insert contact message
    $query = "INSERT INTO feedback (feedback_id, name, email, subject, message, type, status, created_at) 
              VALUES (?, ?, ?, ?, ?, 'admin_contact', 'unread', NOW())";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $feedbackId,
        trim($input['name']),
        trim($input['email']),
        trim($input['subject']),
        trim($input['message'])
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Your message has been sent successfully. We will get back to you soon.',
        'feedback_id' => $feedbackId
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
