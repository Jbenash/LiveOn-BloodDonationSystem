<?php
// Set CORS headers dynamically
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db_connection.php';
require_once '../config/session_config.php';

// Initialize session properly
initSession();

// Debug session information
$debug_info = [
    'session_id' => session_id(),
    'session_status' => session_status(),
    'session_data' => $_SESSION,
    'user_id_isset' => isset($_SESSION['user_id']),
    'user_id_value' => $_SESSION['user_id'] ?? 'NOT_SET',
    'role_isset' => isset($_SESSION['role']),
    'role_value' => $_SESSION['role'] ?? 'NOT_SET',
    'is_admin_check' => isset($_SESSION['role']) && $_SESSION['role'] === 'admin',
    'auth_check_passes' => isset($_SESSION['user_id']) && $_SESSION['role'] === 'admin'
];

echo json_encode([
    'success' => true,
    'message' => 'Debug information for donor reminders session',
    'debug' => $debug_info,
    'can_access_donor_reminders' => isset($_SESSION['user_id']) && $_SESSION['role'] === 'admin'
]);
?>
