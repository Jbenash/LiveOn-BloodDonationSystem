<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$donorId = $_GET['donor_id'] ?? '';
if (!$donorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing donor_id']);
    exit();
}

$host = 'localhost';
$dbname = 'liveon_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $stmt = $pdo->prepare("SELECT donation_id, blood_type, donation_date, units_donated, hospital_id FROM donations WHERE donor_id = :donor_id ORDER BY donation_date DESC");
    $stmt->bindParam(':donor_id', $donorId);
    $stmt->execute();
    $donations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'donations' => $donations]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} 