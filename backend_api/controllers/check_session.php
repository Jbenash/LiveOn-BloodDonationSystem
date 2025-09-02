<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

echo json_encode([
    'session_status' => [
        'session_started' => session_status() === PHP_SESSION_ACTIVE,
        'user_id' => $_SESSION['user_id'] ?? 'NOT_SET',
        'role' => $_SESSION['role'] ?? 'NOT_SET',
        'name' => $_SESSION['name'] ?? 'NOT_SET',
        'email' => $_SESSION['email'] ?? 'NOT_SET',
        'is_admin' => isset($_SESSION['role']) && $_SESSION['role'] === 'admin',
        'session_id' => session_id(),
        'all_session_data' => $_SESSION
    ],
    'message' => 'Session check completed'
]);
