<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
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

$verification_id = $data['verification_id'] ?? null;
$donor_id = $data['donor_id'] ?? null;

if (!$verification_id || !$donor_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing verification_id or donor_id"]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // First get the user_id from donors table
    $sql1 = "SELECT user_id FROM donors WHERE donor_id = ?";
    $stmt1 = $conn->prepare($sql1);
    if (!$stmt1) {
        throw new Exception("Prepare failed for user lookup: " . $conn->error);
    }
    $stmt1->bind_param('s', $donor_id);
    
    if (!$stmt1->execute()) {
        throw new Exception("User lookup failed: " . $stmt1->error);
    }
    
    $result = $stmt1->get_result();
    if ($result->num_rows === 0) {
        throw new Exception("Donor not found");
    }
    
    $row = $result->fetch_assoc();
    $user_id = $row['user_id'];
    $stmt1->close();

    // Delete from medical_verifications table
    $sql2 = "DELETE FROM medical_verifications WHERE verification_id = ? AND donor_id = ?";
    $stmt2 = $conn->prepare($sql2);
    if (!$stmt2) {
        throw new Exception("Prepare failed for deletion: " . $conn->error);
    }
    $stmt2->bind_param('ss', $verification_id, $donor_id);
    
    if (!$stmt2->execute()) {
        throw new Exception("Deletion failed: " . $stmt2->error);
    }
    
    if ($stmt2->affected_rows === 0) {
        throw new Exception("No medical verification record found to delete");
    }
    $stmt2->close();

    // Update users table status to 'inactive'
    $sql3 = "UPDATE users SET status = 'inactive' WHERE user_id = ?";
    $stmt3 = $conn->prepare($sql3);
    if (!$stmt3) {
        throw new Exception("Prepare failed for user update: " . $conn->error);
    }
    $stmt3->bind_param('s', $user_id);
    
    if (!$stmt3->execute()) {
        throw new Exception("User update failed: " . $stmt3->error);
    }
    $stmt3->close();

    // Commit transaction
    $conn->commit();
    
    echo json_encode(["success" => true, "message" => "Medical verification deleted and user status updated to pending"]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close(); 