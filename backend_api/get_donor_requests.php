<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
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

$sql = "SELECT d.donor_id, u.name AS donor_fullname, u.email AS donor_email, ov.otp_code AS otp_number,
        u.status, u.role
FROM donors d
INNER JOIN users u ON d.user_id = u.user_id
LEFT JOIN otp_verification ov ON u.user_id = ov.user_id
WHERE u.role = 'donor' AND u.status = 'inactive'";
$result = $conn->query($sql);

$donors = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $donors[] = $row;
    }
}

$conn->close();

echo json_encode($donors); 