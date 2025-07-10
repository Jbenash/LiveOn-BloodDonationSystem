<?php
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
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

$sql = "SELECT d.donor_id, u.name AS full_name, u.email, d.blood_type AS blood_group, 
        d.address, d.city, d.last_donation_date, d.lives_saved, d.status
FROM donors d
INNER JOIN users u ON d.user_id = u.user_id
INNER JOIN medical_verifications mv ON d.donor_id = mv.donor_id
WHERE u.role = 'donor'
ORDER BY mv.verification_date DESC";
$result = $conn->query($sql);

$donors = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $donors[] = $row;
    }
}

$conn->close();

echo json_encode($donors); 