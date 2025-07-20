<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();
    $stmt = $pdo->query("SELECT notification_id, user_id, message, type, status, timestamp FROM notifications ORDER BY timestamp DESC LIMIT 50");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'notifications' => $notifications]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to fetch notifications', 'details' => $e->getMessage()]);
}
