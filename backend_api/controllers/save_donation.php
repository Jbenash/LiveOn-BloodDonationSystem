<?php
// Prevent HTML error output and ensure clean JSON responses
ob_start();
ini_set('display_errors', 0);
ini_set('html_errors', 0);
error_reporting(0);

$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Clear any buffered output before setting JSON header
ob_clean();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include MRO authentication
require_once __DIR__ . '/../helpers/mro_auth.php';

// Check MRO session using centralized auth
checkMROSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    require_once __DIR__ . '/../services/DonorService.php';
    require_once __DIR__ . '/../config/db_connection.php';

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit();
    }

    $database = new Database();
    $pdo = $database->connect();

    // Get hospital_id for this MRO
    $user_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare('SELECT hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !$row['hospital_id']) {
        echo json_encode(['success' => false, 'error' => 'Hospital not found for this MRO']);
        exit();
    }

    // Add hospital_id to input data
    $input['hospital_id'] = $row['hospital_id'];

    $donorService = new DonorService($pdo);
    $result = $donorService->saveDonation($input);

    if ($result['success']) {
        echo json_encode($result);
    } else {
        http_response_code(500);
        echo json_encode($result);
    }
} catch (Throwable $e) {
    error_log('Fatal error in save_donation.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error. Please check the logs.']);
}
