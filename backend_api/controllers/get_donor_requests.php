<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

// Require MRO role
requireRole('mro');

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->getConnection();

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

    // Fetch donation requests from the donation_requests table
    // Only show pending requests for this MRO's hospital
    $sql = "SELECT dr.request_id, dr.donor_id, dr.blood_type, dr.reason, dr.status, dr.request_date,
            u.name AS donor_fullname, u.email AS donor_email, u.phone AS donor_phone,
            h.name AS hospital_name, h.location AS hospital_location
    FROM donation_requests dr
    LEFT JOIN donors d ON dr.donor_id = d.donor_id
    LEFT JOIN users u ON d.user_id = u.user_id
    LEFT JOIN hospitals h ON dr.hospital_id = h.hospital_id
    WHERE dr.status = 'pending' AND dr.hospital_id = ?
    ORDER BY dr.request_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mro_hospital_id]);
    $donationRequests = $stmt->fetchAll();

    echo json_encode($donationRequests);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}
