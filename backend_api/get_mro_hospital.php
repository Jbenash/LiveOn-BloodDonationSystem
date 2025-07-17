<?php
session_start();
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'mro') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once 'db_connection.php';
try {
    $database = new Database();
    $pdo = $database->connect();
    $user_id = $_SESSION['user_id'];
    // Get hospital_id for this MRO
    $stmt = $pdo->prepare('SELECT hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !$row['hospital_id']) {
        echo json_encode(['error' => 'Hospital not found for this MRO']);
        exit();
    }
    $hospital_id = $row['hospital_id'];
    // Get hospital name
    $stmt2 = $pdo->prepare('SELECT name FROM hospitals WHERE hospital_id = ?');
    $stmt2->execute([$hospital_id]);
    $hospital = $stmt2->fetch(PDO::FETCH_ASSOC);
    if (!$hospital) {
        echo json_encode(['error' => 'Hospital not found']);
        exit();
    }
    echo json_encode(['success' => true, 'hospital_name' => $hospital['name']]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
