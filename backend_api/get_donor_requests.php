<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

session_start();

// Handle preflight requests
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

// Only allow MROs to access, and get their hospital_id
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'mro') {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}
$mro_user_id = $_SESSION['user_id'];
$mro_hospital_id = null;
$mro_stmt = $conn->prepare("SELECT hospital_id FROM mro_officers WHERE user_id = ?");
$mro_stmt->bind_param('s', $mro_user_id);
$mro_stmt->execute();
$mro_result = $mro_stmt->get_result();
if ($row = $mro_result->fetch_assoc()) {
    $mro_hospital_id = $row['hospital_id'];
}
$mro_stmt->close();
if (!$mro_hospital_id) {
    http_response_code(403);
    echo json_encode(["error" => "No hospital assigned to this MRO"]);
    $conn->close();
    exit();
}

// Now fetch only donor requests for this hospital
$sql = "SELECT d.donor_id, u.name AS donor_fullname, u.email AS donor_email, ov.otp_code AS otp_number,
        d.blood_type AS blood_group, d.preferred_hospital_id,
        u.status, u.role
FROM donors d
INNER JOIN users u ON d.user_id = u.user_id
LEFT JOIN otp_verification ov ON u.user_id = ov.user_id
WHERE u.role = 'donor' AND u.status = 'inactive' AND d.preferred_hospital_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $mro_hospital_id);
$stmt->execute();
$result = $stmt->get_result();
$donors = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $donors[] = $row;
    }
}
$stmt->close();
$conn->close();
echo json_encode($donors);
