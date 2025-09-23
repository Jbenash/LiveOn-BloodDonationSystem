<?php
require_once __DIR__ . '/../helpers/mro_auth.php';

// Check MRO authentication (includes CORS, session init, and auth check)
$currentUser = checkMROSession();

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

    // 1. Get pending donor requests (waiting for MRO verification)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as pending_requests 
        FROM donor_requests 
        WHERE preferred_hospital_id = ? AND status = 'pending'
    ");
    $stmt->execute([$hospital_id]);
    $pending_requests = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Get total donors registered for this hospital (excluding rejected users)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total_donors 
        FROM donors d 
        INNER JOIN users u ON d.user_id = u.user_id 
        WHERE d.preferred_hospital_id = ? AND u.role = 'donor' AND u.status != 'rejected'
    ");
    $stmt->execute([$hospital_id]);
    $total_donors = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Get active donors (user status = active and donor status = available, excluding rejected)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as active_donors 
        FROM donors d 
        INNER JOIN users u ON d.user_id = u.user_id 
        WHERE d.preferred_hospital_id = ? 
        AND u.role = 'donor' 
        AND u.status = 'active' 
        AND d.status = 'available'
    ");
    $stmt->execute([$hospital_id]);
    $active_donors = $stmt->fetch(PDO::FETCH_ASSOC);

    // 4. Get not available donors (donated recently, excluding rejected)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as not_available_donors 
        FROM donors d 
        INNER JOIN users u ON d.user_id = u.user_id 
        WHERE d.preferred_hospital_id = ? 
        AND u.role = 'donor' 
        AND u.status = 'active' 
        AND d.status = 'not available'
    ");
    $stmt->execute([$hospital_id]);
    $not_available_donors = $stmt->fetch(PDO::FETCH_ASSOC);

    // 5. Get inactive donors (not yet verified by MRO, excluding rejected)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as inactive_donors 
        FROM donors d 
        INNER JOIN users u ON d.user_id = u.user_id 
        WHERE d.preferred_hospital_id = ? 
        AND u.role = 'donor' 
        AND u.status = 'inactive'
    ");
    $stmt->execute([$hospital_id]);
    $inactive_donors = $stmt->fetch(PDO::FETCH_ASSOC);

    // 6. Get total medical verifications done by this MRO
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total_verifications 
        FROM medical_verifications mv
        INNER JOIN donors d ON mv.donor_id = d.donor_id
        WHERE d.preferred_hospital_id = ?
    ");
    $stmt->execute([$hospital_id]);
    $total_verifications = $stmt->fetch(PDO::FETCH_ASSOC);

    // 7. Get total donations made at this hospital
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total_donations 
        FROM donations 
        WHERE hospital_id = ?
    ");
    $stmt->execute([$hospital_id]);
    $donations = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get recent medical verifications (excluding rejected users)
    $stmt = $pdo->prepare("
        SELECT mv.verification_id, u.name as donor_name, mv.verification_date, 
               CASE WHEN u.status = 'active' THEN 'verified' ELSE 'pending' END as status
        FROM medical_verifications mv
        INNER JOIN donors d ON mv.donor_id = d.donor_id
        INNER JOIN users u ON d.user_id = u.user_id
        WHERE d.preferred_hospital_id = ? AND u.status != 'rejected'
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

    // Get recent donations for this hospital (excluding rejected users)
    $stmt = $pdo->prepare("
        SELECT d.donation_id, d.blood_type, d.units_donated, d.donation_date, u.name as donor_name
        FROM donations d
        INNER JOIN donors dn ON d.donor_id = dn.donor_id
        INNER JOIN users u ON dn.user_id = u.user_id
        WHERE d.hospital_id = ? AND u.status != 'rejected'
        ORDER BY d.donation_date DESC
        LIMIT 5
    ");
    $stmt->execute([$hospital_id]);
    $recent_donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'mro_id' => $mro['mro_id'],
        'hospital_id' => $hospital_id,
        'hospital_name' => $hospital['name'],
        'hospital_location' => $hospital['location'],
        'hospital_contact' => $hospital['contact_phone'],

        // Donor counts
        'total_donors' => $total_donors['total_donors'],
        'pending_requests' => $pending_requests['pending_requests'],
        'active_donors' => $active_donors['active_donors'],
        'not_available_donors' => $not_available_donors['not_available_donors'],
        'inactive_donors' => $inactive_donors['inactive_donors'],

        // Verification and donation counts
        'total_verifications' => $total_verifications['total_verifications'],
        'total_donations' => $donations['total_donations'],

        // Detailed data
        'recent_verifications' => $recent_verifications,
        'recent_donations' => $recent_donations,
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
