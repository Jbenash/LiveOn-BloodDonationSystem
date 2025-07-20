<?php
// backend_api/submit_feedback.php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

$input = json_decode(file_get_contents('php://input'), true);
$donorId = $input['donorId'] ?? null;
$message = trim($input['feedback'] ?? '');

if (!$donorId || !$message) {
    echo json_encode(["success" => false, "message" => "Missing donorId or feedback message."]);
    exit();
}

try {
    $db = new Database();
    $pdo = $db->connect();
    // Get user_id from donors table
    $stmt = $pdo->prepare("SELECT user_id FROM donors WHERE donor_id = ?");
    $stmt->execute([$donorId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(["success" => false, "message" => "Donor not found."]);
        exit();
    }
    $userId = $row['user_id'];
    // Insert feedback with unique feedback_id
    $feedbackId = 'FB' . substr(uniqid(), -8);
    $stmt2 = $pdo->prepare("INSERT INTO feedback (feedback_id, message, role, user_id, created_at) VALUES (?, ?, 'donor', ?, NOW())");
    $stmt2->execute([$feedbackId, $message, $userId]);
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
