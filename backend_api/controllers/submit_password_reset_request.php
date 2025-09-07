<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once __DIR__ . '/../config/db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['email'], $data['requested_password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

$db = new Database();
$pdo = $db->connect();

// Find user by email
$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->execute([$data['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

try {
    // Start transaction to ensure atomicity
    $pdo->beginTransaction();

    // Insert password reset request
    $stmt = $pdo->prepare("INSERT INTO password_reset_requests (user_id, requested_password) VALUES (?, ?)");
    $stmt->execute([$user['user_id'], $data['requested_password']]);
    $requestId = $pdo->lastInsertId();

    // Create a single notification - use request_id to ensure uniqueness
    $msg = 'User ' . $data['email'] . ' wants to change their password (Request #' . $requestId . ')';

    // Always create only one notification, using the request_id as unique identifier
    $firstAdmin = $pdo->query("SELECT user_id FROM users WHERE role = 'admin' ORDER BY user_id LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if ($firstAdmin) {
        // Delete any existing notifications for this user's password reset requests that are unread
        $cleanupStmt = $pdo->prepare("DELETE FROM notifications WHERE type = 'password_reset' AND message LIKE ? AND status = 'unread'");
        $cleanupStmt->execute(['%' . $data['email'] . '%']);

        // Now create the new notification
        $notif = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
        $notif->execute([
            $firstAdmin['user_id'],
            $msg,
            'password_reset',
            'unread'
        ]);
    }

    // Commit the transaction
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Password reset request submitted']);
} catch (Exception $e) {
    // Rollback on error
    $pdo->rollback();
    echo json_encode(['success' => false, 'message' => 'Failed to submit request: ' . $e->getMessage()]);
}
