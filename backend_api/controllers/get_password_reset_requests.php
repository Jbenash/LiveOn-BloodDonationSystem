<?php
// Prevent multiple includes
if (!defined('SESSION_CONFIG_LOADED')) {
    require_once __DIR__ . '/../config/session_config.php';
}

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Require admin role
requireRole('admin');

require_once __DIR__ . '/../classes/Core/Database.php';

$db = \LiveOn\classes\Core\Database::getInstance();
$pdo = $db->getConnection();

$stmt = $pdo->query("
    SELECT r.request_id, r.user_id, u.name, u.email, r.requested_password, r.status, r.created_at
    FROM password_reset_requests r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status IN ('pending', 'rejected')
    ORDER BY r.created_at DESC
");
echo json_encode(['success' => true, 'requests' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
