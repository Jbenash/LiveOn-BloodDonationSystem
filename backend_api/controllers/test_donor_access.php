<?php
session_start();

// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

require_once __DIR__ . '/../config/db_connection.php';

$db = new Database();
$pdo = $db->connect();

$debug_info = [
    'session_data' => $_SESSION,
    'user_id_in_session' => $_SESSION['user_id'] ?? 'NOT_SET',
    'role_in_session' => $_SESSION['role'] ?? 'NOT_SET',
    'name_in_session' => $_SESSION['name'] ?? 'NOT_SET'
];

if (isset($_SESSION['user_id'])) {
    // Check if user exists in users table
    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $debug_info['user_in_users_table'] = $user ? 'EXISTS' : 'NOT_FOUND';
    $debug_info['user_data'] = $user;

    if ($user) {
        $debug_info['user_status'] = $user['status'];
        $debug_info['user_role'] = $user['role'];
    }

    // Check if donor record exists
    $stmt = $pdo->prepare("SELECT * FROM donors WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $donor = $stmt->fetch(PDO::FETCH_ASSOC);

    $debug_info['donor_in_donors_table'] = $donor ? 'EXISTS' : 'NOT_FOUND';
    $debug_info['donor_data'] = $donor;

    // Check all users with role 'donor'
    $stmt = $pdo->prepare("SELECT user_id, name, email, status, role FROM users WHERE role = 'donor'");
    $stmt->execute();
    $all_donor_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debug_info['all_donor_users'] = $all_donor_users;

    // Check all donors
    $stmt = $pdo->prepare("SELECT d.*, u.name, u.email, u.status FROM donors d JOIN users u ON d.user_id = u.user_id");
    $stmt->execute();
    $all_donors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $debug_info['all_donors'] = $all_donors;
}

echo json_encode($debug_info, JSON_PRETTY_PRINT);
