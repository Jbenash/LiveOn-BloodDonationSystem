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

        // Delete all blood inventory records for this hospital
        $stmt = $pdo->prepare("DELETE FROM blood_inventory WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Delete all donations associated with this hospital
        $stmt = $pdo->prepare("DELETE FROM donations WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Delete all donation requests for this hospital
        $stmt = $pdo->prepare("DELETE FROM donation_requests WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Delete all emergency requests for this hospital
        $stmt = $pdo->prepare("DELETE FROM emergency_requests WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Delete all MRO officers associated with this hospital
        $stmt = $pdo->prepare("DELETE FROM mro_officers WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Update donor preferred hospital if it was this hospital
        $stmt = $pdo->prepare("UPDATE donors SET preferred_hospital_id = NULL WHERE preferred_hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // Delete the hospital record
        $stmt = $pdo->prepare("DELETE FROM hospitals WHERE hospital_id = ?");
        $stmt->execute([$hospitalId]);

        // If there's an associated user account, update it to inactive
        if ($userId) {
            $stmt = $pdo->prepare("UPDATE users SET status = 'inactive' WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Create notification for the user about their hospital removal
            $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
            $message = "Your hospital account has been permanently removed from the system by an administrator. Your user account remains but is now inactive.";
            $notificationStmt->execute([$userId, $message, 'hospital_removal']);
        }

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Hospital and all related records removed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
