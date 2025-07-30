<?php
// Turn off error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();

// Set CORS headers dynamically
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Function to send JSON response and exit
function sendJsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    sendJsonResponse([
        'success' => false,
        'error' => 'No user session found',
        'message' => 'Please log in first'
    ], 401);
}

// Check if user has admin role
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendJsonResponse([
        'success' => false,
        'error' => 'Access denied',
        'message' => 'Admin role required',
        'current_role' => $_SESSION['role'] ?? 'not set'
    ], 403);
}

try {
    // Check if required files exist
    $requiredFiles = [
        __DIR__ . '/AdminController.php',
        __DIR__ . '/../classes/ResponseHandler.php',
        __DIR__ . '/../classes/Database.php',
        __DIR__ . '/../classes/Exceptions.php'
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
    // Log the error for debugging
    error_log("Admin Dashboard Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());

    sendJsonResponse([
        'success' => false,
        'error' => 'Server error',
        'message' => 'Failed to load dashboard data',
        'debug' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ], 500);
}
