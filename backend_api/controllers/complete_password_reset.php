<?php
// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

require_once __DIR__ . '/../classes/Core/Database.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['request_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

$db = \LiveOn\classes\Core\Database::getInstance();
$pdo = $db->getConnection();

// Get user_id from request
$stmt = $pdo->prepare("SELECT user_id FROM password_reset_requests WHERE request_id = ?");
$stmt->execute([$data['request_id']]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Request not found']);
    exit;
}
$user_id = $row['user_id'];

if (isset($data['reject']) && $data['reject']) {
    // Mark request as rejected
    $pdo->prepare("UPDATE password_reset_requests SET status = 'rejected', completed_at = NOW() WHERE request_id = ?")->execute([$data['request_id']]);
    echo json_encode(['success' => true, 'message' => 'Password reset request rejected']);
    exit;
}

if (!isset($data['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing new password']);
    exit;
}

// Update user password
$hash = password_hash($data['new_password'], PASSWORD_BCRYPT);
$pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?")->execute([$hash, $user_id]);

// Mark request as completed
$pdo->prepare("UPDATE password_reset_requests SET status = 'completed', completed_at = NOW() WHERE request_id = ?")->execute([$data['request_id']]);

echo json_encode(['success' => true, 'message' => 'Password updated']);
