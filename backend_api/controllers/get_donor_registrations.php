<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Check if user is logged in and has MRO role
$currentUser = getCurrentUser();
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in. Please log in first.']);
    exit();
}

if ($currentUser['role'] !== 'mro') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. MRO role required.']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    $user_id = $_SESSION['user_id'];

    // Get hospital_id for this MRO
    $stmt = $pdo->prepare('SELECT hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !$row['hospital_id']) {
        echo json_encode(['error' => 'Hospital not found for this MRO']);
        exit();
    }

    $hospital_id = $row['hospital_id'];

    $sql = "SELECT d.donor_id, u.name AS full_name, u.email, d.blood_type AS blood_group, 
            d.address, d.city, d.preferred_hospital_id, h.name AS preferred_hospital_name, d.last_donation_date, d.lives_saved, d.status, mv.verification_date AS verification_date
    FROM donors d
    INNER JOIN users u ON d.user_id = u.user_id
    INNER JOIN medical_verifications mv ON d.donor_id = mv.donor_id
    LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
    WHERE u.role = 'donor' AND d.preferred_hospital_id = :hospital_id
    ORDER BY mv.verification_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['hospital_id' => $hospital_id]);
    $donors = $stmt->fetchAll();

    echo json_encode($donors);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
