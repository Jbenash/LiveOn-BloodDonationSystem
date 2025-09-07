<?php
require_once __DIR__ . '/../config/session_config.php';
configureSession();
session_start();

header('Content-Type: application/json');
// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Add more detailed session debugging
if (!isset($_SESSION['user_id'])) {
    error_log('edit_user.php: No user_id in session');
    http_response_code(401);
    echo json_encode(['error' => 'No active session', 'debug' => 'user_id not set']);
    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    error_log('edit_user.php: User role is not admin. Role: ' . ($_SESSION['role'] ?? 'not set'));
    http_response_code(401);
    echo json_encode(['error' => 'Admin access required', 'debug' => 'role check failed']);
    exit;
}

require_once __DIR__ . '/../config/db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
}

$user_id = $data['user_id'];
$name = isset($data['name']) ? trim($data['name']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$status = isset($data['status']) ? trim($data['status']) : null;
$password = isset($data['password']) ? $data['password'] : null;

try {
    $database = new Database();
    $pdo = $database->connect();

    $fields = [];
    $params = [];
    if ($name !== null) {
        $fields[] = 'name = :name';
        $params[':name'] = $name;
    }
    if ($phone !== null) {
        $fields[] = 'phone = :phone';
        $params[':phone'] = $phone;
    }
    if ($status !== null) {
        $fields[] = 'status = :status';
        $params[':status'] = $status;
    }
    if ($password !== null && $password !== '') {
        $fields[] = 'password_hash = :password_hash';
        $params[':password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }
    if (empty($fields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    $params[':user_id'] = $user_id;
    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE user_id = :user_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
