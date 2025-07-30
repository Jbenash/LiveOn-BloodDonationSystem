<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5174');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Use the new MedicalVerificationController with proper OOP structure
require_once __DIR__ . '/MedicalVerificationController.php';

try {
    $controller = new MedicalVerificationController();

    // Route the request based on the action parameter
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'create':
            $controller->createVerification();
            break;

        case 'get_by_donor':
            $controller->getVerificationByDonorId();
            break;

        case 'get_all':
            $controller->getAllVerifications();
            break;

        case 'update':
            $controller->updateVerification();
            break;

        case 'delete':
            $controller->deleteVerification();
            break;

        case 'stats':
            $controller->getVerificationStats();
            break;

        case 'by_date_range':
            $controller->getVerificationsByDateRange();
            break;

        case 'update_age':
            $controller->updateAge();
            break;

        case 'by_mro':
            $controller->getVerificationsByMroId();
            break;

        case 'recent':
            $controller->getRecentVerifications();
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action. Available actions: create, get_by_donor, get_all, update, delete, stats, by_date_range, update_age, by_mro, recent']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
