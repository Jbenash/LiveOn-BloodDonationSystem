<?php
session_start();
header('Content-Type: application/json');
// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Use the new DonorController with proper OOP structure
require_once __DIR__ . '/DonorController.php';

try {
    $controller = new DonorController();

    // Route the request based on the action parameter
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'register':
            $controller->registerDonor();
            break;

        case 'verify_otp':
            $controller->verifyOTP();
            break;

        case 'resend_otp':
            $controller->resendOTP();
            break;

        case 'profile':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $controller->getDonorProfile();
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                $controller->updateDonorProfile();
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'stats':
            $controller->getDonorStats();
            break;

        case 'search':
            $controller->searchDonors();
            break;

        case 'update_status':
            $controller->updateDonorStatus();
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action specified']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
