<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Check if user is logged in and has admin role
$currentUser = getCurrentUser();
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in. Please log in first.']);
    exit();
}

if ($currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Admin role required.']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    // Fetch all MROs with their user details and hospital information
    $sql = "SELECT 
                m.mro_id,
                m.user_id,
                m.hospital_id,
                u.name,
                u.email,
                u.phone,
                h.name as hospital_name
            FROM mro_officers m
            LEFT JOIN users u ON m.user_id = u.user_id
            LEFT JOIN hospitals h ON m.hospital_id = h.hospital_id
            ORDER BY m.mro_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $mros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'mros' => $mros]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
