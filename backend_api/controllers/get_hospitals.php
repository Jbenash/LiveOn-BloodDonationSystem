<?php
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

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->query("SELECT hospital_id, name, location FROM hospitals ORDER BY name ASC");
    $hospitals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'hospitals' => $hospitals]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
