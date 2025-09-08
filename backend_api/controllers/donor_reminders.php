<?php
// Set CORS headers dynamically
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db_connection.php';
require_once '../config/session_config.php';
require_once '../services/DonorReminderService.php';

use LiveOn\Services\DonorReminderService;

// Initialize session properly
initSession();

// Ensure the user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Admin role required.']);
    exit();
}

try {
    $reminderService = new DonorReminderService();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            handleGetRequest($reminderService, $action);
            break;
        case 'POST':
            handlePostRequest($reminderService, $action);
            break;
        case 'PUT':
            handlePutRequest($reminderService, $action);
            break;
        default:
            throw new Exception('Unsupported request method');
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

function handleGetRequest($reminderService, $action)
{
    switch ($action) {
        case 'settings':
            $settings = $reminderService->getReminderSettings();
            echo json_encode(['success' => true, 'data' => $settings]);
            break;

        case 'donors_needing_reminders':
            $donors = $reminderService->getDonorsNeedingReminders();
            echo json_encode(['success' => true, 'data' => $donors]);
            break;

        case 'stats':
            $days = $_GET['days'] ?? 30;
            $stats = $reminderService->getReminderStats($days);
            echo json_encode(['success' => true, 'data' => $stats]);
            break;

        default:
            throw new Exception('Invalid action for GET request');
    }
}

function handlePostRequest($reminderService, $action)
{
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'send_reminders':
            $results = $reminderService->processAllReminders();
            echo json_encode([
                'success' => true,
                'message' => "Processed {$results['total_processed']} reminders. {$results['successful']} sent successfully, {$results['failed']} failed.",
                'data' => $results
            ]);
            break;

        case 'send_single_reminder':
            if (!isset($input['donor_id'])) {
                throw new Exception('Donor ID is required');
            }

            // Get donor data
            $database = new Database();
            $pdo = $database->connect();
            $stmt = $pdo->prepare("
                SELECT d.donor_id, d.user_id, u.name, u.phone, u.email, d.status as donor_status, u.status as user_status
                FROM donors d
                JOIN users u ON d.user_id = u.user_id
                WHERE d.donor_id = ?
            ");
            $stmt->execute([$input['donor_id']]);
            $donor = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$donor) {
                throw new Exception('Donor not found');
            }

            if (!$donor['phone']) {
                throw new Exception('Donor does not have a phone number');
            }

            $result = $reminderService->sendSMSReminder($donor);

            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => "Reminder sent successfully to {$donor['name']}"
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => "Failed to send reminder: " . ($result['error'] ?? 'Unknown error')
                ]);
            }
            break;

        default:
            throw new Exception('Invalid action for POST request');
    }
}

function handlePutRequest($reminderService, $action)
{
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'settings':
            if (!isset($input['settings'])) {
                throw new Exception('Settings data is required');
            }

            $success = $reminderService->updateReminderSettings($input['settings'], $_SESSION['user_id']);

            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Reminder settings updated successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update reminder settings'
                ]);
            }
            break;

        default:
            throw new Exception('Invalid action for PUT request');
    }
}
