<?php
session_start();

// Set CORS headers dynamically
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
    exit(0);
}

echo json_encode([
    'session_status' => [
        'session_started' => session_status() === PHP_SESSION_ACTIVE,
        'user_id' => $_SESSION['user_id'] ?? 'NOT_SET',
        'role' => $_SESSION['role'] ?? 'NOT_SET',
        'name' => $_SESSION['name'] ?? 'NOT_SET',
        'email' => $_SESSION['email'] ?? 'NOT_SET',
        'is_admin' => isset($_SESSION['role']) && $_SESSION['role'] === 'admin',
        'session_id' => session_id(),
        'all_session_data' => $_SESSION
    ],
    'message' => 'Session check completed'
]);
