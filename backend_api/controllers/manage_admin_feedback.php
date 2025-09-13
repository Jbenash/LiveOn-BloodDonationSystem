<?php
require_once '../config/db_connection.php';
require_once '../config/session_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

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
        // Log the admin action
        $action_text = $action === 'approve' ? 'Approved feedback' : 'Rejected feedback';
        $log_stmt = $pdo->prepare("
            INSERT INTO admin_logs (admin_id, action, target_table, target_id, timestamp) 
            VALUES (?, ?, 'feedback', ?, NOW())
        ");
        $log_stmt->execute([$admin_id, $action_text, $feedback_id]);
        
        // Get updated feedback details for response
        $updated_stmt = $pdo->prepare("
            SELECT 
                f.feedback_id,
                f.user_id,
                f.role,
                f.message,
                f.created_at,
                f.approved,
                u.full_name as user_name,
                CASE 
                    WHEN f.role = 'hospital' THEN h.name
                    WHEN f.role = 'donor' THEN CONCAT(d.first_name, ' ', d.last_name)
                    WHEN f.role = 'mro' THEN m.officer_name
                    ELSE u.full_name
                END as organization_name
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.user_id
            LEFT JOIN hospitals h ON f.user_id = h.user_id AND f.role = 'hospital'
            LEFT JOIN donors d ON f.user_id = d.user_id AND f.role = 'donor'
            LEFT JOIN mro_officers m ON f.user_id = m.user_id AND f.role = 'mro'
            WHERE f.feedback_id = ?
        ");
        
        $updated_stmt->execute([$feedback_id]);
        $updated_feedback = $updated_stmt->fetch(PDO::FETCH_ASSOC);
        
        $updated_feedback['status'] = $approved_value == 1 ? 'approved' : 'rejected';
        
        echo json_encode([
            'success' => true,
            'message' => ucfirst($action) . 'd feedback successfully',
            'feedback' => $updated_feedback
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