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

// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

require_once __DIR__ . '/../classes/Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    // Only allow MROs to access, and get their hospital_id
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'mro') {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit();
    }

    $mro_user_id = $_SESSION['user_id'];
    $mro_hospital_id = null;
    $mro_stmt = $pdo->prepare("SELECT hospital_id FROM mro_officers WHERE user_id = ?");
    $mro_stmt->execute([$mro_user_id]);
    $row = $mro_stmt->fetch();
    if ($row) {
        $mro_hospital_id = $row['hospital_id'];
    }

    if (!$mro_hospital_id) {
        http_response_code(403);
        echo json_encode(["error" => "No hospital assigned to this MRO"]);
        exit();
    }

    // Fetch donor requests from the new donor_requests table
    // Only show pending requests for this MRO's hospital
    $sql = "SELECT dr.request_id, dr.donor_id, u.name AS donor_fullname, u.email AS donor_email, 
            ov.otp_code AS otp_number, dr.dob, dr.address, dr.city, dr.preferred_hospital_id,
            u.status, u.role, dr.created_at
    FROM donor_requests dr
    INNER JOIN users u ON dr.user_id = u.user_id
    LEFT JOIN otp_verification ov ON u.user_id = ov.user_id AND ov.verified = 1
    WHERE dr.status = 'pending' AND dr.preferred_hospital_id = ?
    ORDER BY dr.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mro_hospital_id]);
    $donors = $stmt->fetchAll();

    echo json_encode($donors);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}
