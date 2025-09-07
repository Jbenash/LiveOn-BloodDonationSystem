<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session properly
initSession();

// Check if user is logged in and has admin role
$currentUser = getCurrentUser();
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in. Please log in first.']);
    exit();
}

if ($currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Admin role required.']);
    exit();
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }

    $mro_id = $data['mro_id'] ?? null;
    $name = $data['name'] ?? null;
    $email = $data['email'] ?? null;
    $phone = $data['phone'] ?? null;
    $hospital_id = $data['hospital_id'] ?? null;

    // Validate required fields
    if (!$mro_id || !$name || !$email || !$phone || !$hospital_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Get the user_id associated with this MRO
        $stmt = $pdo->prepare("SELECT user_id FROM mro_officers WHERE mro_id = ?");
        $stmt->execute([$mro_id]);
        $mro = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mro) {
            throw new Exception('MRO not found');
        }

        $user_id = $mro['user_id'];

        // Check if email is already used by another user (excluding current user)
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
        $stmt->execute([$email, $user_id]);
        if ($stmt->fetch()) {
            throw new Exception('Email is already in use by another user');
        }

        // Verify hospital exists
        $stmt = $pdo->prepare("SELECT hospital_id FROM hospitals WHERE hospital_id = ?");
        $stmt->execute([$hospital_id]);
        if (!$stmt->fetch()) {
            throw new Exception('Selected hospital does not exist');
        }

        // Update user information
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?");
        $stmt->execute([$name, $email, $phone, $user_id]);

        // Update MRO hospital assignment
        $stmt = $pdo->prepare("UPDATE mro_officers SET hospital_id = ? WHERE mro_id = ?");
        $stmt->execute([$hospital_id, $mro_id]);

        // Commit transaction
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'MRO updated successfully'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating MRO: ' . $e->getMessage()
    ]);
}
