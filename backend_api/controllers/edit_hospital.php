<?php
require_once __DIR__ . '/../config/session_config.php';
configureSession();
session_start();

header('Content-Type: application/json');
// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Add more detailed session debugging
if (!isset($_SESSION['user_id'])) {
    error_log('edit_hospital.php: No user_id in session');
    http_response_code(401);
    echo json_encode(['error' => 'No active session', 'debug' => 'user_id not set']);
    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    error_log('edit_hospital.php: User role is not admin. Role: ' . ($_SESSION['role'] ?? 'not set'));
    http_response_code(401);
    echo json_encode(['error' => 'Admin access required', 'debug' => 'role check failed']);
    exit;
}

require_once __DIR__ . '/../config/db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['hospital_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing hospital_id']);
    exit;
}

$hospital_id = $data['hospital_id'];
$name = isset($data['name']) ? trim($data['name']) : null;
$location = isset($data['location']) ? trim($data['location']) : null;
$contact_email = isset($data['contact_email']) ? trim($data['contact_email']) : null;
$contact_phone = isset($data['contact_phone']) ? trim($data['contact_phone']) : null;

try {
    $database = new Database();
    $pdo = $database->connect();

    $fields = [];
    $params = [];

    if ($name !== null && $name !== '') {
        $fields[] = 'name = :name';
        $params[':name'] = $name;
    }
    if ($location !== null) {
        $fields[] = 'location = :location';
        $params[':location'] = $location;
    }
    if ($contact_email !== null) {
        // Validate email format
        if ($contact_email !== '' && !filter_var($contact_email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }
        $fields[] = 'contact_email = :contact_email';
        $params[':contact_email'] = $contact_email;
    }
    if ($contact_phone !== null) {
        // Validate phone format (numbers only)
        if ($contact_phone !== '' && !preg_match('/^[0-9]*$/', $contact_phone)) {
            echo json_encode(['success' => false, 'message' => 'Phone number can only contain numbers']);
            exit;
        }
        $fields[] = 'contact_phone = :contact_phone';
        $params[':contact_phone'] = $contact_phone;
    }

    if (empty($fields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    $params[':hospital_id'] = $hospital_id;
    $sql = 'UPDATE hospitals SET ' . implode(', ', $fields) . ' WHERE hospital_id = :hospital_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Hospital updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Hospital not found or no changes made']);
    }
} catch (PDOException $e) {
    error_log('Edit hospital database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
