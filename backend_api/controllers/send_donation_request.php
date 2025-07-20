<?php
session_start();
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'hospital') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';
$db = new Database();
$pdo = $db->connect();

$data = json_decode(file_get_contents("php://input"), true);
$donorId = $data['donorId'] ?? null;
$reason = $data['reason'] ?? null;

if (!$donorId) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid donor']);
    exit();
}
if (!$reason) {
    http_response_code(400);
    echo json_encode(['error' => 'Reason is required']);
    exit();
}

$hospitalIdStmt = $pdo->prepare("SELECT hospital_id FROM hospitals WHERE user_id = ?");
$hospitalIdStmt->execute([$_SESSION['user_id']]);
$hospital = $hospitalIdStmt->fetch(PDO::FETCH_ASSOC);

if (!$hospital) {
    http_response_code(404);
    echo json_encode(['error' => 'Hospital not found']);
    exit();
}

$requestId = uniqid("REQ");
$stmt = $pdo->prepare("INSERT INTO donation_requests (request_id, hospital_id, donor_id, reason, status, request_date) VALUES (?, ?, ?, ?, 'pending', NOW())");
$stmt->execute([$requestId, $hospital['hospital_id'], $donorId, $reason]);

echo json_encode(['message' => 'Donation request sent successfully']);
