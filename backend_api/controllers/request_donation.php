<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'hospital') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    http_response_code(401);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';
$db = new Database();
$pdo = $db->connect();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['donorId'])) {
    echo json_encode(['success' => false, 'message' => 'Missing donor ID']);
    exit();
}

$donorId = $data['donorId'];
$hospitalUserId = $_SESSION['user_id'];

try {
    // Get hospital information
    $stmt = $pdo->prepare("SELECT hospital_id FROM hospitals WHERE user_id = ?");
    $stmt->execute([$hospitalUserId]);
    $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$hospital) {
        echo json_encode(['success' => false, 'message' => 'Hospital not found']);
        exit();
    }

    // Check if donor exists and is available
    $stmt = $pdo->prepare("SELECT d.*, u.name, u.phone FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.donor_id = ? AND d.status = 'approved'");
    $stmt->execute([$donorId]);
    $donor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$donor) {
        echo json_encode(['success' => false, 'message' => 'Donor not found or not available']);
        exit();
    }

    // Check if donor is eligible (6 months since last donation)
    $lastDonation = $donor['last_donation_date'];
    if ($lastDonation) {
        $lastDonationDate = new DateTime($lastDonation);
        $sixMonthsAgo = new DateTime();
        $sixMonthsAgo->modify('-6 months');

        if ($lastDonationDate > $sixMonthsAgo) {
            echo json_encode(['success' => false, 'message' => 'Donor is not eligible yet. Last donation was on ' . $lastDonation]);
            exit();
        }
    }

    // Create donation request notification
    $notificationId = 'NT' . uniqid();
    $stmt = $pdo->prepare("INSERT INTO notifications (notification_id, user_id, message, type, status) VALUES (?, ?, ?, 'request', 'unread')");
    $message = "Hospital has requested a blood donation from you. Please contact the hospital for details.";
    $stmt->execute([$notificationId, $donor['user_id'], $message]);

    echo json_encode(['success' => true, 'message' => 'Donation request sent successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
