<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../classes/Database.php';

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
    $database = Database::getInstance();
    $pdo = $database->connect();

    // Generate unique feedback ID
    $feedbackId = 'FB' . strtoupper(substr(md5(uniqid()), 0, 6));

    // Insert contact message into feedback table
    $query = "INSERT INTO feedback (feedback_id, user_id, role, message, approved, created_at) 
              VALUES (?, ?, ?, ?, ?, NOW())";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $feedbackId,
        'CONTACT', // Special user_id for contact form
        'admin', // Role for contact form
        json_encode([
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'subject' => trim($input['subject']),
            'message' => trim($input['message'])
        ]),
        0 // Not approved by default
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
