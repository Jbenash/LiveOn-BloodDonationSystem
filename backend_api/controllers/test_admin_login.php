<?php
session_start();
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Test admin login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    try {
        require_once __DIR__ . '/../config/db_connection.php';
        require_once __DIR__ . '/../classes/User.php';

        $db = new Database();
        $conn = $db->connect();
        $user = new User($conn);

        $result = $user->login($username, $password);

        if ($result && isset($result['role']) && $result['role'] === 'admin') {
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['role'] = $result['role'];
            $_SESSION['name'] = $result['name'];

            echo json_encode([
                'success' => true,
                'message' => 'Admin login successful',
                'user' => $result
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials or not admin'
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} else {
    // GET request - show current session status
    echo json_encode([
        'session_exists' => isset($_SESSION['user_id']),
        'user_id' => $_SESSION['user_id'] ?? null,
        'role' => $_SESSION['role'] ?? null,
        'name' => $_SESSION['name'] ?? null,
        'is_admin' => isset($_SESSION['role']) && $_SESSION['role'] === 'admin',
        'full_session' => $_SESSION
    ]);
}
