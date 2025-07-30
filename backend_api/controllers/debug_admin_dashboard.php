<?php
// Turn off error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Start output buffering to catch any unexpected output
ob_start();

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5174');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Function to send JSON response and exit
function sendJsonResponse($data, $statusCode = 200)
{
    // Clear any output buffer
    ob_clean();
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

try {
    // Check session status
    $sessionInfo = [
        'session_exists' => isset($_SESSION['user_id']),
        'user_id' => $_SESSION['user_id'] ?? null,
        'role' => $_SESSION['role'] ?? null,
        'name' => $_SESSION['name'] ?? null,
        'is_admin' => isset($_SESSION['role']) && $_SESSION['role'] === 'admin'
    ];

    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        sendJsonResponse([
            'success' => false,
            'error' => 'No user session found',
            'message' => 'Please log in first',
            'debug' => $sessionInfo
        ], 401);
    }

    // Check if user has admin role
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        sendJsonResponse([
            'success' => false,
            'error' => 'Access denied',
            'message' => 'Admin role required',
            'debug' => $sessionInfo
        ], 403);
    }

    // Check if required files exist
    $requiredFiles = [
        __DIR__ . '/AdminController.php',
        __DIR__ . '/../classes/ResponseHandler.php',
        __DIR__ . '/../classes/Database.php',
        __DIR__ . '/../classes/Exceptions.php'
    ];

    $missingFiles = [];
    foreach ($requiredFiles as $file) {
        if (!file_exists($file)) {
            $missingFiles[] = basename($file);
        }
    }

    if (!empty($missingFiles)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Missing required files',
            'missing_files' => $missingFiles
        ], 500);
    }

    // Test database connection
    try {
        require_once __DIR__ . '/../classes/Database.php';
        $database = Database::getInstance();
        $pdo = $database->connect();

        // Test a simple query
        $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $dbError) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $dbError->getMessage()
        ], 500);
    }

    // If we get here, everything is working
    sendJsonResponse([
        'success' => true,
        'message' => 'All systems operational',
        'debug' => [
            'session' => $sessionInfo,
            'database' => 'Connected',
            'total_users' => $result['total_users'],
            'files_exist' => true
        ]
    ]);
} catch (Exception $e) {
    // Get any output that might have been generated
    $output = ob_get_contents();
    ob_clean();

    // Log the error
    error_log("Admin Dashboard Debug Error: " . $e->getMessage());
    error_log("Output buffer: " . $output);

    sendJsonResponse([
        'success' => false,
        'error' => 'Server error',
        'message' => 'Failed to load dashboard data',
        'debug' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'output_buffer' => $output
        ]
    ], 500);
}
