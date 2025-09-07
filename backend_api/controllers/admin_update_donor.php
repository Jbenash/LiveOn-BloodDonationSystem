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

    // Add logging for debugging
    error_log('admin_update_donor.php: Received data: ' . json_encode($data));

    if (!$data || !isset($data['donorId'])) {
        echo json_encode(['success' => false, 'message' => 'Missing donor ID']);
        exit();
    }

    $donorId = $data['donorId'];
    $name = $data['name'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    $bloodType = $data['blood_type'] ?? null;
    $city = $data['city'] ?? null;
    $status = $data['status'] ?? null;

    // Add logging for individual fields
    error_log('admin_update_donor.php: Blood type received: ' . ($bloodType ?? 'NULL'));

    // Validate required fields
    if (!$name || !$email || !$phone || !$bloodType || !$city || !$status) {
        $missing = [];
        if (!$name) $missing[] = 'name';
        if (!$email) $missing[] = 'email';
        if (!$phone) $missing[] = 'phone';
        if (!$bloodType) $missing[] = 'blood_type';
        if (!$city) $missing[] = 'city';
        if (!$status) $missing[] = 'status';

        error_log('admin_update_donor.php: Missing fields: ' . implode(', ', $missing));
        echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . implode(', ', $missing)]);
        exit();
    }

    // Validate name to prevent numeric input
    if (!preg_match('/^[a-zA-Z\s]+$/', $name) || is_numeric(str_replace(' ', '', $name))) {
        echo json_encode(['success' => false, 'message' => 'Name must contain only letters and spaces, and cannot be purely numeric']);
        exit();
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }

    // Validate phone number format
    if (!preg_match('/^[0-9]+$/', $phone) || strlen($phone) !== 10) {
        echo json_encode(['success' => false, 'message' => 'Phone number must be exactly 10 digits']);
        exit();
    }

    // Validate blood type
    $validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!in_array($bloodType, $validBloodTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid blood type']);
        exit();
    }

    // Validate status
    $validStatuses = ['available', 'not available'];
    if (!in_array($status, $validStatuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Verify the donor exists and get user_id
        $stmt = $pdo->prepare("SELECT d.donor_id, d.user_id, u.name, u.email FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.donor_id = ?");
        $stmt->execute([$donorId]);
        $donor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$donor) {
            throw new Exception('Donor not found');
        }

        $userId = $donor['user_id'];

        // Check if email is already taken by another user
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
        $stmt->execute([$email, $userId]);
        if ($stmt->rowCount() > 0) {
            throw new Exception('Email is already registered by another user');
        }

        // Update users table (name, email, phone)
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?");
        $stmt->execute([$name, $email, $phone, $userId]);

        // Update donors table (blood_type, city, status)
        $stmt = $pdo->prepare("UPDATE donors SET blood_type = ?, city = ?, status = ? WHERE donor_id = ?");
        $stmt->execute([$bloodType, $city, $status, $donorId]);

        // Create notification for the donor about the update
        $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, 'unread', NOW())");
        $message = "Your donor profile has been updated by an administrator. Please review your information.";
        $notificationStmt->execute([$userId, $message, 'profile_update']);

        // Commit transaction
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Donor information updated successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
