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

require_once __DIR__ . '/../classes/Database.php';

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
    $database = Database::getInstance();
    $pdo = $database->connect();

    // Generate unique feedback ID
    $feedbackId = 'FB' . substr(uniqid(), -8);

    // Insert admin contact message into feedback table
    $query = "INSERT INTO feedback (feedback_id, user_id, role, message, approved, created_at) 
              VALUES (?, ?, ?, ?, ?, NOW())";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $feedbackId,
        'ADMIN_CONTACT', // Special user_id for admin contact
        'admin', // Role for admin contact
        json_encode([
            'name' => $name,
            'email' => $email,
            'subject' => $subject,
            'message' => $message,
            'type' => $type
        ]),
        0 // Not approved by default
    ]);

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
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
