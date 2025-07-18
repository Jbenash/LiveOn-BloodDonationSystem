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

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liveon_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection error: ' . $conn->connect_error]);
    exit();
}

$donor_id = $data['donor_id'];
// Get user_id from donors table
$sql = "SELECT user_id FROM donors WHERE donor_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $donor_id);
$stmt->execute();
$stmt->bind_result($user_id);
$stmt->fetch();
$stmt->close();

if (!$user_id) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Donor not found']);
    $conn->close();
    exit();
}

// Update users table status to 'rejected'
$sql2 = "UPDATE users SET status = 'rejected' WHERE user_id = ?";
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param('s', $user_id);
if ($stmt2->execute()) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update user status']);
}
$stmt2->close();
$conn->close(); 