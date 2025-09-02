<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['donor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing donor_id']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $donor_id = $data['donor_id'];

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Get user_id from donor_requests table
        $sql = "SELECT user_id FROM donor_requests WHERE donor_id = ? AND status = 'pending'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$donor_id]);
        $row = $stmt->fetch();
        $user_id = $row['user_id'] ?? null;

        if (!$user_id) {
            throw new Exception('Donor request not found or already processed');
        }

        // Update donor_requests status to 'rejected'
        $sql2 = "UPDATE donor_requests SET status = 'rejected', updated_at = NOW() WHERE donor_id = ? AND status = 'pending'";
        $stmt2 = $pdo->prepare($sql2);
        $stmt2->execute([$donor_id]);

        // Update users table status to 'rejected'
        $sql3 = "UPDATE users SET status = 'rejected' WHERE user_id = ?";
        $stmt3 = $pdo->prepare($sql3);
        $stmt3->execute([$user_id]);

        // Insert notification for donor rejection
        $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
        $notifStmt->execute([$user_id, "Donor registration rejected: $donor_id", 'error', 'unread']);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
