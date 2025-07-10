<?php
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

error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liveon_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$donor_id = $data['donor_id'] ?? null;
$mro_id = 'MRO001'; // Always use MRO001 as the default value
$height_cm = $data['height_cm'] ?? null;
$weight_kg = $data['weight_kg'] ?? null;
$medical_history = $data['medical_history'] ?? null;
$doctor_notes = $data['doctor_notes'] ?? null;
$verification_date = $data['verification_date'] ?? null;

if (!$donor_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing donor_id"]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // Generate a unique verification_id (e.g., 'MV' + uniqid())
    $verification_id = 'MV' . substr(uniqid(), -8);

    // Insert into medical_verifications table
    $sql = "INSERT INTO medical_verifications (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param('ssssssss', $verification_id, $donor_id, $mro_id, $height_cm, $weight_kg, $medical_history, $doctor_notes, $verification_date);

    if (!$stmt->execute()) {
        throw new Exception("Insert failed: " . $stmt->error);
    }
    $stmt->close();

    // Update users table to set status to 'active'
    // First get the user_id from donors table
    $sql2 = "SELECT user_id FROM donors WHERE donor_id = ?";
    $stmt2 = $conn->prepare($sql2);
    if (!$stmt2) {
        throw new Exception("Prepare failed for user lookup: " . $conn->error);
    }
    $stmt2->bind_param('s', $donor_id);
    
    if (!$stmt2->execute()) {
        throw new Exception("User lookup failed: " . $stmt2->error);
    }
    
    $result = $stmt2->get_result();
    if ($result->num_rows === 0) {
        throw new Exception("Donor not found");
    }
    
    $row = $result->fetch_assoc();
    $user_id = $row['user_id'];
    $stmt2->close();

    // Update users table status to 'active'
    $sql3 = "UPDATE users SET status = 'active' WHERE user_id = ?";
    $stmt3 = $conn->prepare($sql3);
    if (!$stmt3) {
        throw new Exception("Prepare failed for user update: " . $conn->error);
    }
    $stmt3->bind_param('s', $user_id);
    
    if (!$stmt3->execute()) {
        throw new Exception("User update failed: " . $stmt3->error);
    }
    $stmt3->close();

    // Update donors table status to 'available'
    $sql4 = "UPDATE donors SET status = 'available' WHERE donor_id = ?";
    $stmt4 = $conn->prepare($sql4);
    if (!$stmt4) {
        throw new Exception("Prepare failed for donor update: " . $conn->error);
    }
    $stmt4->bind_param('s', $donor_id);
    if (!$stmt4->execute()) {
        throw new Exception("Donor update failed: " . $stmt4->error);
    }
    $stmt4->close();

    // Commit transaction
    $conn->commit();
    
    echo json_encode(["success" => true, "verification_id" => $verification_id, "user_status_updated" => true]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close(); 
