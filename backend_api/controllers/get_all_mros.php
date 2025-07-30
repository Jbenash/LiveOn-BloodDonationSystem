<?php
session_start();

// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin access required']);
    http_response_code(401);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    // Fetch all MROs with their user details and hospital information
    $sql = "SELECT 
                m.mro_id,
                m.user_id,
                m.hospital_id,
                u.name,
                u.email,
                u.phone,
                h.name as hospital_name
            FROM mro_officers m
            LEFT JOIN users u ON m.user_id = u.user_id
            LEFT JOIN hospitals h ON m.hospital_id = h.hospital_id
            ORDER BY m.mro_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $mros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'mros' => $mros]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
