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

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin access required']);
    http_response_code(401);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['hospitalId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing hospital ID']);
        exit();
    }

    $hospitalId = $data['hospitalId'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the hospital exists and get its details
        $stmt = $pdo->prepare("SELECT hospital_id, name, user_id FROM hospitals WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);
        $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$hospital) {
            throw new Exception('Hospital not found');
        }

        $userId = $hospital['user_id'];

        // Soft delete: Change associated user status to 'rejected' instead of hard deleting
        if ($userId) {
            $stmt = $pdo->prepare("UPDATE users SET status = 'rejected' WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Create notification for the user about their hospital deactivation
            $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
            $message = "Your hospital account has been deactivated by an administrator. Contact support if you believe this is an error.";
            $notificationStmt->execute([$userId, $message, 'warning']);
        }

        // Log the admin action for audit trail
        $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_table, target_id) VALUES (?, ?, ?, ?)");
        $actionText = "Hospital status changed to rejected: {$hospital['name']} (User ID: {$userId})";
        $stmt->execute([$_SESSION['user_id'], $actionText, 'hospitals', $hospitalId]);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => "Hospital {$hospital['name']} has been deactivated (user status changed to rejected)"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
