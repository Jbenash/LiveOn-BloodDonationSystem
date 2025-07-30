<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
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
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
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
    $approved = ($action === 'approve') ? 1 : 0;
    $stmt = $pdo->prepare("UPDATE feedback SET approved = ? WHERE feedback_id = ?");
    $stmt->execute([$approved, $feedbackId]);

    // Log admin action
    $adminId = $_SESSION['user_id'];
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
