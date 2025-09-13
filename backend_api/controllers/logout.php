<?php
require_once __DIR__ . '/../config/session_config.php';

// Set explicit CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize session before logout
initSession();

// Perform complete logout
$result = performLogout();

// Ensure proper response headers
header('Content-Type: application/json');

echo json_encode($result);
