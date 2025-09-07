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

    if (!$data || !isset($data['mroId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing MRO ID']);
        exit();
    }

    $mroId = $data['mroId'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the MRO exists and get its details
        $stmt = $pdo->prepare("SELECT mro_id, user_id FROM mro_officers WHERE mro_id = ?");
        $stmt->execute([$mroId]);
        $mro = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mro) {
            throw new Exception('MRO not found');
        }

        $userId = $mro['user_id'];

        // Soft delete: Change associated user status to 'rejected' instead of hard deleting
        if ($userId) {
            $stmt = $pdo->prepare("UPDATE users SET status = 'rejected' WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Create notification for the user about their MRO deactivation
            $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
            $message = "Your MRO officer account has been deactivated by an administrator. Contact support if you believe this is an error.";
            $notificationStmt->execute([$userId, $message, 'warning']);
        }

        // Log the admin action for audit trail
        $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_table, target_id) VALUES (?, ?, ?, ?)");
        $actionText = "MRO officer status changed to rejected: {$mroId} (User ID: {$userId})";
        $stmt->execute([$_SESSION['user_id'], $actionText, 'mro_officers', $mroId]);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => "MRO officer {$mroId} has been deactivated (user status changed to rejected)"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
