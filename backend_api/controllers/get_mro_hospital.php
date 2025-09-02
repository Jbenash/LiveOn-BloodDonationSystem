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

    // Get hospital_id for this MRO
    $stmt = $pdo->prepare('SELECT hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !$row['hospital_id']) {
        echo json_encode(['error' => 'Hospital not found for this MRO']);
        exit();
    }

    $hospital_id = $row['hospital_id'];

    // Get hospital name
    $stmt2 = $pdo->prepare('SELECT name FROM hospitals WHERE hospital_id = ?');
    $stmt2->execute([$hospital_id]);
    $hospital = $stmt2->fetch(PDO::FETCH_ASSOC);

    if (!$hospital) {
        echo json_encode(['error' => 'Hospital not found']);
        exit();
    }

    echo json_encode([
        'success' => true,
        'hospital_id' => $hospital_id,
        'hospital_name' => $hospital['name']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
