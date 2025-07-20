<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    // Get total users count
    $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

    // Get users count by role
    $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $usersByRole = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total donors count (from donors table)
    $stmt = $pdo->query("SELECT COUNT(*) as total_donors FROM donors");
    $totalDonors = $stmt->fetch(PDO::FETCH_ASSOC)['total_donors'];

    // Get total hospitals count (from hospitals table)
    $stmt = $pdo->query("SELECT COUNT(*) as total_hospitals FROM hospitals");
    $totalHospitals = $stmt->fetch(PDO::FETCH_ASSOC)['total_hospitals'];

    // Get pending requests count (from emergency_requests table)
    $stmt = $pdo->query("SELECT COUNT(*) as pending_requests FROM emergency_requests WHERE status = 'pending'");
    $pendingRequests = $stmt->fetch(PDO::FETCH_ASSOC)['pending_requests'];

    // Get recent users (last 5 registrations) - using user_id as proxy for registration order
    $stmt = $pdo->query("
        SELECT u.name, u.email, u.role, u.status, u.user_id
        FROM users u 
        ORDER BY u.user_id DESC 
        LIMIT 5
    ");
    $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent emergency requests
    $stmt = $pdo->query("
        SELECT er.emergency_id, er.blood_type, er.required_units, er.status, er.created_at,
               h.name as hospital_name
        FROM emergency_requests er
        LEFT JOIN hospitals h ON er.hospital_id = h.hospital_id
        ORDER BY er.created_at DESC 
        LIMIT 5
    ");
    $recentRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all users (for Users section)
    $stmt = $pdo->query("SELECT user_id, name, email, phone, role, status FROM users ORDER BY user_id DESC");
    $allUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all hospitals (for Hospitals section)
    $stmt = $pdo->query("SELECT hospital_id, name, location, contact_email, contact_phone FROM hospitals ORDER BY hospital_id DESC");
    $allHospitals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all donors (for Donors section)
    $stmt = $pdo->query("SELECT d.donor_id, u.name, u.email, u.phone, d.blood_type, d.status, d.last_donation_date, d.city, d.lives_saved FROM donors d LEFT JOIN users u ON d.user_id = u.user_id ORDER BY d.donor_id DESC");
    $allDonors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all requests (for Requests section)
    $stmt = $pdo->query("SELECT er.emergency_id, er.blood_type, er.required_units, er.status, er.created_at, h.name as hospital_name, h.location as hospital_location FROM emergency_requests er LEFT JOIN hospitals h ON er.hospital_id = h.hospital_id ORDER BY er.created_at DESC");
    $allRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all feedback (for Feedback section)
    $stmt = $pdo->query("SELECT feedback_id, user_id, role, message, created_at FROM feedback ORDER BY created_at DESC");
    $allFeedback = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all success stories (for Success Stories section)
    $stmt = $pdo->query("SELECT story_id, title, message, created_at FROM success_stories ORDER BY created_at DESC");
    $allSuccessStories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare response
    $response = [
        'success' => true,
        'stats' => [
            'total_users' => (int)$totalUsers,
            'total_donors' => (int)$totalDonors,
            'total_hospitals' => (int)$totalHospitals,
            'pending_requests' => (int)$pendingRequests
        ],
        'users_by_role' => $usersByRole,
        'recent_users' => $recentUsers,
        'recent_requests' => $recentRequests,
        'all_users' => $allUsers,
        'all_hospitals' => $allHospitals,
        'all_donors' => $allDonors,
        'all_requests' => $allRequests,
        'all_feedback' => $allFeedback,
        'all_success_stories' => $allSuccessStories
    ];

    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
