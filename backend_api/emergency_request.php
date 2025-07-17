<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require 'db_connection.php';
$db = new Database();
$pdo = $db->connect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $bloodType = $input['blood_type'] ?? null;
    $requiredUnits = $input['required_units'] ?? null;

    // Get hospital_id from session
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'hospital') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT hospital_id FROM hospitals WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$hospital) {
        echo json_encode(['error' => 'Hospital not found']);
        exit();
    }

    $hospitalId = $hospital['hospital_id'];

    // Insert into emergency_requests
    $insert = $pdo->prepare("INSERT INTO emergency_requests (hospital_id, blood_type, required_units, status) VALUES (?, ?, ?, 'pending')");
    $insert->execute([$hospitalId, $bloodType, $requiredUnits]);

    echo json_encode(['success' => true, 'message' => 'Emergency request sent']);
    exit();
}

echo json_encode(['error' => 'Invalid request']);
