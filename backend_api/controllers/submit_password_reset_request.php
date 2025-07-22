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

// Insert password reset request
$stmt = $pdo->prepare("INSERT INTO password_reset_requests (user_id, requested_password) VALUES (?, ?)");
$stmt->execute([$user['user_id'], $data['requested_password']]);

// Notify all admins (only one notification per admin per user)
$admins = $pdo->query("SELECT user_id FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_ASSOC);
$notif = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
foreach ($admins as $admin) {
    // Check if an unread notification for this user already exists for this admin
    $exists = $pdo->prepare("SELECT 1 FROM notifications WHERE user_id = ? AND message = ? AND type = 'password_reset' AND status = 'unread'");
    $msg = 'User ' . $data['email'] . ' wants to change their password to: ' . $data['requested_password'];
    $exists->execute([$admin['user_id'], $msg]);
    if (!$exists->fetch()) {
        $notif->execute([
            $admin['user_id'],
            $msg,
            'password_reset',
            'unread'
        ]);
    }
}

echo json_encode(['success' => true, 'message' => 'Password reset request submitted']);
