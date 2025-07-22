<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db_connection.php';

$db = new Database();
$pdo = $db->connect();

$stmt = $pdo->query("
    SELECT r.request_id, r.user_id, u.name, u.email, r.requested_password, r.status, r.created_at
    FROM password_reset_requests r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status IN ('pending', 'rejected')
    ORDER BY r.created_at DESC
");
echo json_encode(['success' => true, 'requests' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
