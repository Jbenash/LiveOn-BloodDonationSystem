<?php
require_once '../config/db_connection.php';
require_once '../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session  
initSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    // Create database connection
    $db = new Database();
    $pdo = $db->connect();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['feedback_id']) || !isset($input['action'])) {
        echo json_encode(['success' => false, 'message' => 'Feedback ID and action are required']);
        exit;
    }
    
    $feedback_id = $input['feedback_id'];
    $action = $input['action']; // 'approve' or 'reject'
    $admin_id = $_SESSION['user_id'];
    
    // Validate action
    if (!in_array($action, ['approve', 'reject'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
    }
    
    // Check if feedback exists and is pending
    $check_stmt = $pdo->prepare("SELECT * FROM feedback WHERE feedback_id = ? AND approved = 0");
    $check_stmt->execute([$feedback_id]);
    $feedback = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$feedback) {
        echo json_encode(['success' => false, 'message' => 'Feedback not found or already processed']);
        exit;
    }
    
    // Update feedback status
    $approved_value = $action === 'approve' ? 1 : -1;
    $update_stmt = $pdo->prepare("UPDATE feedback SET approved = ? WHERE feedback_id = ?");
    $result = $update_stmt->execute([$approved_value, $feedback_id]);
    
    if ($result) {
        // Try to log the admin action (skip if it fails)
        try {
            $action_text = $action === 'approve' ? 'Approved feedback' : 'Rejected feedback';
            $log_stmt = $pdo->prepare("
                INSERT INTO admin_logs (admin_id, action, target_table, target_id, timestamp) 
                VALUES (?, ?, 'feedback', ?, NOW())
            ");
            $log_stmt->execute([$admin_id, $action_text, $feedback_id]);
        } catch (PDOException $log_error) {
            // Log the error but don't fail the operation
            error_log("Failed to log admin action: " . $log_error->getMessage());
        }
        
        // Simple success response without complex JOINs
        echo json_encode([
            'success' => true,
            'message' => ucfirst($action) . 'd feedback successfully',
            'feedback_id' => $feedback_id,
            'action' => $action,
            'approved_status' => $approved_value
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update feedback status']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in manage_admin_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in manage_admin_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while processing your request']);
}
?>