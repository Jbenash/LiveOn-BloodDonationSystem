<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $sql = "SELECT d.donor_id, u.name AS full_name, u.email, d.blood_type AS blood_group, 
            d.address, d.city, d.preferred_hospital_id, h.name AS preferred_hospital_name, d.last_donation_date, d.lives_saved, d.status, mv.verification_date AS verification_date
    FROM donors d
    INNER JOIN users u ON d.user_id = u.user_id
    INNER JOIN medical_verifications mv ON d.donor_id = mv.donor_id
    LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
    WHERE u.role = 'donor'
    ORDER BY mv.verification_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $donors = $stmt->fetchAll();

    echo json_encode($donors);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}
