<?php
// Use the exact same session configuration as user_login.php to ensure compatibility
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight (same as login)
setCorsHeaders();
handlePreflight();

// Initialize session the same way as login
initSession();

require_once __DIR__ . '/../config/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check if user is logged in and is a hospital
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'hospital') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Please login as a hospital user.']);
    exit;
}

try {
    // Create database connection
    $db = new Database();
    $pdo = $db->connect();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['message']) || empty(trim($input['message']))) {
        echo json_encode(['success' => false, 'message' => 'Feedback message is required']);
        exit;
    }

    $message = trim($input['message']);
    $user_id = $_SESSION['user_id'];

    // Validate message length
    if (strlen($message) < 10) {
        echo json_encode(['success' => false, 'message' => 'Feedback message must be at least 10 characters long']);
        exit;
    }

    if (strlen($message) > 1000) {
        echo json_encode(['success' => false, 'message' => 'Feedback message must be less than 1000 characters']);
        exit;
    }

    // Generate unique feedback ID
    $feedback_id = 'FB' . uniqid();

    // Insert feedback into database
    $stmt = $pdo->prepare("
        INSERT INTO feedback (feedback_id, user_id, role, message, created_at, approved) 
        VALUES (?, ?, 'hospital', ?, NOW(), 0)
    ");

    $result = $stmt->execute([$feedback_id, $user_id, $message]);

    if ($result) {
        // Log the submission (skip if admin_logs table doesn't exist)
        try {
            $log_stmt = $pdo->prepare("
                INSERT INTO admin_logs (admin_id, action, target_table, target_id, timestamp) 
                VALUES (?, ?, 'feedback', ?, NOW())
            ");
            $log_stmt->execute([null, 'Hospital feedback submitted', $feedback_id]);
        } catch (PDOException $log_error) {
            // Continue even if logging fails
        }

        echo json_encode([
            'success' => true,
            'message' => 'Feedback submitted successfully! It will be reviewed by our admin team.',
            'feedback_id' => $feedback_id
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit feedback']);
    }
} catch (PDOException $e) {
    error_log("Database error in submit_hospital_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in submit_hospital_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while processing your request']);
}
