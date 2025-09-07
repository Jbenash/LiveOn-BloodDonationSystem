<?php
function checkMROSession()
{
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
        echo json_encode(['error' => 'SESSION_EXPIRED', 'message' => 'Please log in again.']);
        exit();
    }

    if ($currentUser['role'] !== 'mro') {
        http_response_code(403);
        echo json_encode(['error' => 'ACCESS_DENIED', 'message' => 'MRO role required.']);
        exit();
    }

    return $currentUser;
}
