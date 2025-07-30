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

require_once __DIR__ . '/../classes/Database.php';

$db = Database::getInstance();
$pdo = $db->getConnection();

$stmt = $pdo->query("
    SELECT r.request_id, r.user_id, u.name, u.email, r.requested_password, r.status, r.created_at
    FROM password_reset_requests r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status IN ('pending', 'rejected')
    ORDER BY r.created_at DESC
");
echo json_encode(['success' => true, 'requests' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
