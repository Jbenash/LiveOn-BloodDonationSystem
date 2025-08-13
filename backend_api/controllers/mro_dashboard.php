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

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->getConnection();
    $user_id = $_SESSION['user_id'];

    // Get MRO information
    $stmt = $pdo->prepare('SELECT mro_id, hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $mro = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$mro) {
        echo json_encode(['error' => 'MRO profile not found']);
        exit();
    }

    $hospital_id = $mro['hospital_id'];

    // Get hospital information
    $stmt = $pdo->prepare('SELECT name, location, contact_phone FROM hospitals WHERE hospital_id = ?');
    $stmt->execute([$hospital_id]);
    $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$hospital) {
        echo json_encode(['error' => 'Hospital not found']);
        exit();
    }

    // Get donor registrations count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total_registrations 
        FROM donors d 
        INNER JOIN users u ON d.user_id = u.user_id 
        WHERE d.preferred_hospital_id = ? AND u.role = 'donor'
    ");
    $stmt->execute([$hospital_id]);
    $registrations = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get donation logs count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total_donations 
        FROM donations d 
        INNER JOIN donors dn ON d.donor_id = dn.donor_id 
        WHERE dn.preferred_hospital_id = ?
    ");
    $stmt->execute([$hospital_id]);
    $donations = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get recent medical verifications
    $stmt = $pdo->prepare("
        SELECT mv.verification_id, u.name as donor_name, mv.verification_date, mv.status
        FROM medical_verifications mv
        INNER JOIN donors d ON mv.donor_id = d.donor_id
        INNER JOIN users u ON d.user_id = u.user_id
        WHERE d.preferred_hospital_id = ?
        ORDER BY mv.verification_date DESC
        LIMIT 5
    ");
    $stmt->execute([$hospital_id]);
    $recent_verifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get blood inventory summary
    $stmt = $pdo->prepare("
        SELECT blood_type, SUM(units_available) as total_units
        FROM blood_inventory 
        WHERE hospital_id = ?
        GROUP BY blood_type
    ");
    $stmt->execute([$hospital_id]);
    $blood_inventory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'mro_id' => $mro['mro_id'],
        'hospital_id' => $hospital_id,
        'hospital_name' => $hospital['name'],
        'hospital_location' => $hospital['location'],
        'hospital_contact' => $hospital['contact_phone'],
        'total_registrations' => $registrations['total_registrations'],
        'total_donations' => $donations['total_donations'],
        'recent_verifications' => $recent_verifications,
        'blood_inventory' => $blood_inventory
    ];

    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

 
