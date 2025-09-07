<?php
// Prevent multiple includes
if (!defined('SESSION_CONFIG_LOADED')) {
    require_once __DIR__ . '/../config/session_config.php';
}

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

// Require admin role
requireRole('admin');

require_once __DIR__ . '/../classes/Core/Database.php';

use \LiveOn\classes\Core\Database;

try {
    $database = Database::getInstance();
    $pdo = $database->connect();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['donorId']) || !isset($data['userId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing donor ID or user ID']);
        exit();
    }

    $donorId = $data['donorId'];
    $userId = $data['userId'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the donor exists
        $stmt = $pdo->prepare("SELECT d.donor_id, d.user_id, u.name, u.email FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.donor_id = ? AND d.user_id = ?");
        $stmt->execute([$donorId, $userId]);
        $donor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$donor) {
            throw new Exception('Donor not found');
        }

        // Soft delete: Change donor status to 'not available' and user status to 'rejected'
        $stmt = $pdo->prepare("UPDATE donors SET status = 'not available' WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        $stmt = $pdo->prepare("UPDATE users SET status = 'rejected' WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Add notification to the user about account deactivation
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
        $notificationMessage = "Your donor account has been deactivated by an administrator. Contact support if you believe this is an error.";
        $stmt->execute([$userId, $notificationMessage, 'warning']);

        // Log the admin action for audit trail
        $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_table, target_id) VALUES (?, ?, ?, ?)");
        $actionText = "Donor status changed to rejected: {$donor['name']} ({$donor['email']})";
        $stmt->execute([$_SESSION['user_id'], $actionText, 'donors', $donorId]);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => "Donor {$donor['name']} has been deactivated (status changed to rejected)"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
