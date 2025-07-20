<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['donor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing donor_id']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $donor_id = $data['donor_id'];
    // Get user_id from donors table
    $sql = "SELECT user_id FROM donors WHERE donor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$donor_id]);
    $row = $stmt->fetch();
    $user_id = $row['user_id'] ?? null;

    if (!$user_id) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Donor not found']);
        exit();
    }

    // Update users table status to 'rejected'
    $sql2 = "UPDATE users SET status = 'rejected' WHERE user_id = ?";
    $stmt2 = $pdo->prepare($sql2);
    if ($stmt2->execute([$user_id])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update user status']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
