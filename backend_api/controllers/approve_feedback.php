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

require_once __DIR__ . '/../config/db_connection.php';

$input = json_decode(file_get_contents('php://input'), true);
$feedbackId = $input['feedbackId'] ?? null;
$action = $input['action'] ?? null; // 'approve' or 'reject'

if (!$feedbackId || !$action) {
    echo json_encode(['success' => false, 'message' => 'Missing feedbackId or action']);
    exit();
}

if (!in_array($action, ['approve', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid action. Must be approve or reject']);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->connect();

    // Start transaction
    $pdo->beginTransaction();

    // Check if feedback exists
    $stmt = $pdo->prepare("SELECT feedback_id, user_id, role, message FROM feedback WHERE feedback_id = ?");
    $stmt->execute([$feedbackId]);
    $feedback = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$feedback) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Feedback not found']);
        exit();
    }

    // Update feedback approval status
    $approved = ($action === 'approve') ? 1 : -1; // -1 for rejected, 1 for approved
    $stmt = $pdo->prepare("UPDATE feedback SET approved = ? WHERE feedback_id = ?");
    $stmt->execute([$approved, $feedbackId]);

    // Log admin action
    $adminId = $currentUser['user_id'];
    $actionText = ($action === 'approve') ? 'Approved feedback' : 'Rejected feedback';
    $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_table, target_id) VALUES (?, ?, 'feedback', ?)");
    $stmt->execute([$adminId, $actionText, $feedbackId]);

    // Send notification to user about feedback status
    $notificationMessage = ($action === 'approve')
        ? 'Your feedback has been approved and is now visible on the homepage.'
        : 'Your feedback has been reviewed and is not suitable for public display.';

    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status) VALUES (?, ?, 'info', 'unread')");
    $stmt->execute([$feedback['user_id'], $notificationMessage]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Feedback ' . $action . 'd successfully',
        'action' => $action
    ]);
} catch (PDOException $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
