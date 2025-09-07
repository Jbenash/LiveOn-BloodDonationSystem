<?php
require_once __DIR__ . '/../config/session_config.php';
configureSession();
session_start();

// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// Add more detailed session debugging
if (!isset($_SESSION['user_id'])) {
    error_log('remove_user.php: No user_id in session');
    echo json_encode(['success' => false, 'message' => 'No active session', 'debug' => 'user_id not set']);
    http_response_code(401);
    exit();
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    error_log('remove_user.php: User role is not admin. Role: ' . ($_SESSION['role'] ?? 'not set'));
    echo json_encode(['success' => false, 'message' => 'Admin access required', 'debug' => 'role check failed']);
    http_response_code(401);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['userId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing user ID']);
        exit();
    }

    $userId = $data['userId'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the user exists
        $stmt = $pdo->prepare("SELECT user_id, name, email, role FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('User not found');
        }

        // Prevent admin from removing themselves
        if ($userId === $_SESSION['user_id']) {
            throw new Exception('Cannot remove your own account');
        }

        // Prevent removing other admin users
        if ($user['role'] === 'admin') {
            throw new Exception('Cannot remove admin users');
        }

        // Soft delete: Change user status to 'rejected' instead of hard deleting
        $stmt = $pdo->prepare("UPDATE users SET status = 'rejected' WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Add a notification to the user about account deactivation
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
        $notificationMessage = "Your account has been deactivated by an administrator. Contact support if you believe this is an error.";
        $stmt->execute([$userId, $notificationMessage, 'warning']);

        // Log the admin action for audit trail
        $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_table, target_id) VALUES (?, ?, ?, ?)");
        $actionText = "User status changed to rejected: {$user['name']} ({$user['email']})";
        $stmt->execute([$_SESSION['user_id'], $actionText, 'users', $userId]);

        // Commit transaction
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => "User {$user['name']} has been deactivated (status changed to rejected)",
            'action' => 'status_changed'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
