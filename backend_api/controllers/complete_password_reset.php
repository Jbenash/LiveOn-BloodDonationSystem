<?php
// Prevent multiple includes
if (!defined('SESSION_CONFIG_LOADED')) {
    require_once __DIR__ . '/../config/session_config.php';
}

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Require admin role
requireRole('admin');

require_once __DIR__ . '/../classes/Core/Database.php';
require_once __DIR__ . '/../services/EmailService.php';
require_once __DIR__ . '/../classes/Core/Validator.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['request_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing request_id']);
    exit;
}

$db = \LiveOn\classes\Core\Database::getInstance();
$pdo = $db->getConnection();

// Get user details from request
$stmt = $pdo->prepare("
    SELECT prr.user_id, u.name, u.email 
    FROM password_reset_requests prr 
    INNER JOIN users u ON prr.user_id = u.user_id 
    WHERE prr.request_id = ?
");
$stmt->execute([$data['request_id']]);
$userInfo = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userInfo) {
    echo json_encode(['success' => false, 'message' => 'Request not found']);
    exit;
}

if (isset($data['reject']) && $data['reject']) {
    // Mark request as rejected
    $pdo->prepare("UPDATE password_reset_requests SET status = 'rejected', completed_at = NOW() WHERE request_id = ?")->execute([$data['request_id']]);
    echo json_encode(['success' => true, 'message' => 'Password reset request rejected']);
    exit;
}

if (!isset($data['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing new password']);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Update user password
    $hash = password_hash($data['new_password'], PASSWORD_BCRYPT);
    $pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?")->execute([$hash, $userInfo['user_id']]);

    // Mark request as completed
    $pdo->prepare("UPDATE password_reset_requests SET status = 'completed', completed_at = NOW() WHERE request_id = ?")->execute([$data['request_id']]);

    // Commit the transaction
    $pdo->commit();

    // Send email confirmation to user
    try {
        $validator = new Validator();
        $emailService = new EmailService($pdo, $validator);
        $emailResult = $emailService->sendPasswordChangeConfirmation($userInfo['email'], $userInfo['name']);

        if (!$emailResult['success']) {
            error_log("Failed to send password change confirmation email: " . $emailResult['message']);
            // Don't fail the whole operation if email fails
        }
    } catch (Exception $emailError) {
        error_log("Email service error: " . $emailError->getMessage());
        // Don't fail the whole operation if email fails
    }

    echo json_encode([
        'success' => true,
        'message' => 'Password updated and confirmation email sent to user'
    ]);
} catch (Exception $e) {
    // Rollback on error
    $pdo->rollback();
    echo json_encode(['success' => false, 'message' => 'Failed to update password: ' . $e->getMessage()]);
}
