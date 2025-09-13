<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session before logout
initSession();

// Perform complete logout
$result = performLogout();

// Ensure proper response headers
header('Content-Type: application/json');

echo json_encode($result);
