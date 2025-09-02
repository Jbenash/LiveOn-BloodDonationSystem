<?php
session_start();

// Dynamic CORS headers
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// Check if user is logged in and is a donor
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'donor') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Donor access required']);
    http_response_code(401);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['donorId']) || !isset($data['reason'])) {
        echo json_encode(['success' => false, 'message' => 'Missing donor ID or reason']);
        exit();
    }

    $donorId = $data['donorId'];
    $reason = $data['reason'];
    $userId = $_SESSION['user_id'];

    // Verify the donor exists and belongs to the logged-in user
    $stmt = $pdo->prepare("SELECT d.donor_id, d.user_id, u.name, u.email FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.donor_id = ? AND d.user_id = ?");
    $stmt->execute([$donorId, $userId]);
    $donor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$donor) {
        echo json_encode(['success' => false, 'message' => 'Donor not found or unauthorized']);
        exit();
    }

    // Get all admin users
    $adminStmt = $pdo->prepare("SELECT user_id FROM users WHERE role = 'admin'");
    $adminStmt->execute();
    $admins = $adminStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($admins)) {
        echo json_encode(['success' => false, 'message' => 'No admin users found']);
        exit();
    }

    // Create notifications for all admins
    $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");

    foreach ($admins as $admin) {
        $message = "Donor {$donor['name']} ({$donor['email']}) has requested to be removed from the system. Reason: {$reason}";
        $notificationStmt->execute([$admin['user_id'], $message]);
    }

    echo json_encode(['success' => true, 'message' => 'Removal request sent to administrators successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
