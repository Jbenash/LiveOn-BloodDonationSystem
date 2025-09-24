<?php
require_once __DIR__ . '/../helpers/mro_auth.php';

// Check MRO authentication (includes CORS, session init, and auth check)
$currentUser = checkMROSession();

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

    // Fetch donor registration requests from the donor_requests table
    // Only show pending requests for this MRO's hospital where the user has verified their OTP
    $sql = "SELECT dr.request_id, dr.donor_id, dr.user_id, dr.dob, dr.address, dr.city, dr.preferred_hospital_id, dr.status, dr.created_at,
            u.name AS donor_fullname, u.email AS donor_email, u.phone AS donor_phone,
            h.name AS hospital_name, h.location AS hospital_location
    FROM donor_requests dr
    LEFT JOIN users u ON dr.user_id = u.user_id
    LEFT JOIN hospitals h ON dr.preferred_hospital_id = h.hospital_id
    INNER JOIN otp_verification ov ON dr.user_id = ov.user_id
    WHERE dr.status = 'pending' AND dr.preferred_hospital_id = ? AND ov.verified = 1
    ORDER BY dr.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mro_hospital_id]);
    $donorRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return success response with the data
    echo json_encode([
        'success' => true,
        'requests' => $donorRequests
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage()
    ]);
}
