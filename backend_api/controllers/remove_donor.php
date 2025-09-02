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

        // Delete all donation records for this donor
        $stmt = $pdo->prepare("DELETE FROM donations WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        // Delete medical verification records for this donor
        $stmt = $pdo->prepare("DELETE FROM medical_verifications WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        // Delete donation requests for this donor
        $stmt = $pdo->prepare("DELETE FROM donation_requests WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        // Delete rewards for this donor
        $stmt = $pdo->prepare("DELETE FROM rewards WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        // Delete feedback for this donor (by user_id)
        $stmt = $pdo->prepare("DELETE FROM feedback WHERE user_id = ? AND role = 'donor'");
        $stmt->execute([$userId]);

        // Delete notifications for this donor (by user_id)
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete OTP verification records for this donor (by user_id)
        $stmt = $pdo->prepare("DELETE FROM otp_verification WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete password reset requests for this donor (by user_id)
        $stmt = $pdo->prepare("DELETE FROM password_reset_requests WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Finally, delete the donor record
        $stmt = $pdo->prepare("DELETE FROM donors WHERE donor_id = ?");
        $stmt->execute([$donorId]);

        // Update user status to inactive (keep user record but mark as inactive)
        $stmt = $pdo->prepare("UPDATE users SET status = 'inactive' WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Create notification for the user about their removal (if they ever log back in)
        $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
        $message = "Your donor account has been permanently removed from the system by an administrator. Your user account remains but is now inactive.";
        $notificationStmt->execute([$userId, $message, 'account_removal']);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Donor and all related records removed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
