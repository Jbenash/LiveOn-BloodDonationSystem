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

    if (!$data || !isset($data['userId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing user ID']);
        exit();
    }

    $userId = $data['userId'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the user exists
        $stmt = $pdo->prepare("SELECT user_id, name, email, role FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('User not found');
        }

        // Prevent admin from removing themselves
        if ($userId === $_SESSION['user_id']) {
            throw new Exception('Cannot remove your own account');
        }

        // Delete all donation records for this user (if they are a donor)
        $stmt = $pdo->prepare("DELETE d FROM donations d JOIN donors dr ON d.donor_id = dr.donor_id WHERE dr.user_id = ?");
        $stmt->execute([$userId]);

        // Delete medical verification records for this user (if they are a donor)
        $stmt = $pdo->prepare("DELETE mv FROM medical_verifications mv JOIN donors dr ON mv.donor_id = dr.donor_id WHERE dr.user_id = ?");
        $stmt->execute([$userId]);

        // Delete donation requests for this user (if they are a donor)
        $stmt = $pdo->prepare("DELETE dr FROM donation_requests dr JOIN donors d ON dr.donor_id = d.donor_id WHERE d.user_id = ?");
        $stmt->execute([$userId]);

        // Delete rewards for this user (if they are a donor)
        $stmt = $pdo->prepare("DELETE r FROM rewards r JOIN donors dr ON r.donor_id = dr.donor_id WHERE dr.user_id = ?");
        $stmt->execute([$userId]);

        // Delete donor records for this user
        $stmt = $pdo->prepare("DELETE FROM donors WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete hospital records for this user (if they are a hospital)
        $stmt = $pdo->prepare("DELETE FROM hospitals WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete MRO records for this user (if they are an MRO)
        $stmt = $pdo->prepare("DELETE FROM mro_officers WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete feedback for this user
        $stmt = $pdo->prepare("DELETE FROM feedback WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete notifications for this user
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete OTP verification records for this user
        $stmt = $pdo->prepare("DELETE FROM otp_verification WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Delete password reset requests for this user
        $stmt = $pdo->prepare("DELETE FROM password_reset_requests WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Update user status to inactive (keep user record but mark as inactive)
        $stmt = $pdo->prepare("UPDATE users SET status = 'inactive' WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Create notification for the user about their removal (if they ever log back in)
        $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
        $message = "Your account has been permanently removed from the system by an administrator. Your user account remains but is now inactive.";
        $notificationStmt->execute([$userId, $message, 'account_removal']);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'User and all related records removed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
