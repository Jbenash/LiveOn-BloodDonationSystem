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

// Test admin login with existing admin user
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_once __DIR__ . '/../classes/Database.php';
        require_once __DIR__ . '/../classes/User.php';

        $database = Database::getInstance();
        $pdo = $database->connect();
        $user = new User($pdo);

        // Use existing admin credentials from database
        $adminEmail = 'admin@liveon.lk';
        $adminPassword = 'password123'; // This should match the hash in database

        $result = $user->login($adminEmail, $adminPassword);

        if ($result && isset($result['role']) && $result['role'] === 'admin') {
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['role'] = $result['role'];
            $_SESSION['name'] = $result['name'];

            echo json_encode([
                'success' => true,
                'message' => 'Admin login successful',
                'user' => $result,
                'session' => $_SESSION
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials or not admin',
                'debug' => [
                    'result' => $result,
                    'email' => $adminEmail
                ]
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
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
