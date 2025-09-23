<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Check if simple format is requested (for compatibility with donor dashboard and login modal)
$simple = isset($_GET['simple']) || isset($_POST['simple']);

if ($simple) {
    // Simple format for donor dashboard and login modal compatibility
    $currentUser = getCurrentUser();

    if ($currentUser && isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => true,
            'valid' => true,
            'user_id' => $_SESSION['user_id'],
            'role' => $_SESSION['role'] ?? null,
            'session_id' => session_id()
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'valid' => false,
            'session_id' => session_id()
        ]);
    }
} else {
    // Detailed format for admin dashboard
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
}
