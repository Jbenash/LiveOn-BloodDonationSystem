<?php
// Prevent multiple includes
if (!defined('SESSION_CONFIG_LOADED')) {
    require_once __DIR__ . '/../config/session_config.php';
}

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

// Require admin role
requireRole('admin');

try {
    // Check if required files exist
    $requiredFiles = [
        __DIR__ . '/AdminController.php',
        __DIR__ . '/../classes/Core/ResponseHandler.php',
        __DIR__ . '/../classes/Core/Database.php',
        __DIR__ . '/../classes/Exceptions.php',
        __DIR__ . '/../classes/Core/Validator.php'
    ];

    foreach ($requiredFiles as $file) {
        if (!file_exists($file)) {
            throw new Exception("Required file not found: " . basename($file));
        }
    }

    // Include required files
    require_once __DIR__ . '/AdminController.php';

    // Create admin controller and get dashboard data
    $adminController = new AdminController();
    $adminController->getDashboardData();
} catch (Exception $e) {
    error_log("Admin Dashboard Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => 'Failed to load dashboard data: ' . $e->getMessage()
    ]);
    exit();
}
