<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

require_once '../config/db_connection.php';

try {
    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Fetch system activities from various tables
    $activities = [];

    // 1. Recent user registrations
    $userQuery = "SELECT 
                    user_id,
                    name,
                    email,
                    role,
                    created_at
                  FROM users 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  ORDER BY created_at DESC 
                  LIMIT 10";
    
    $stmt = $pdo->prepare($userQuery);
    $stmt->execute();
    $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentUsers as $user) {
        $activities[] = [
            'id' => 'user_' . $user['user_id'],
            'type' => 'user_registration',
            'message' => "New {$user['role']} registered: {$user['name']} ({$user['email']})",
            'timestamp' => $user['created_at'],
            'status' => 'unread'
        ];
    }

    // 2. Recent donations
    $donationQuery = "SELECT 
                        d.donation_id,
                        d.donor_id,
                        d.blood_type,
                        d.volume,
                        d.donation_date,
                        dn.name as donor_name
                      FROM donations d
                      LEFT JOIN donors dn ON d.donor_id = dn.donor_id
                      WHERE d.donation_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                      ORDER BY d.donation_date DESC 
                      LIMIT 10";
    
    $stmt = $pdo->prepare($donationQuery);
    $stmt->execute();
    $recentDonations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentDonations as $donation) {
        $activities[] = [
            'id' => 'donation_' . $donation['donation_id'],
            'type' => 'blood_donation',
            'message' => "Blood donation: {$donation['donor_name']} donated {$donation['volume']}ml of {$donation['blood_type']}",
            'timestamp' => $donation['donation_date'],
            'status' => 'unread'
        ];
    }

    // 3. Recent donation requests
    $requestQuery = "SELECT 
                      dr.request_id,
                      dr.hospital_id,
                      dr.blood_type,
                      dr.volume_needed,
                      dr.status,
                      dr.created_at,
                      h.name as hospital_name
                    FROM donation_requests dr
                    LEFT JOIN hospitals h ON dr.hospital_id = h.hospital_id
                    WHERE dr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    ORDER BY dr.created_at DESC 
                    LIMIT 10";
    
    $stmt = $pdo->prepare($requestQuery);
    $stmt->execute();
    $recentRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentRequests as $request) {
        $activities[] = [
            'id' => 'request_' . $request['request_id'],
            'type' => 'donation_request',
            'message' => "Blood request: {$request['hospital_name']} needs {$request['volume_needed']}ml of {$request['blood_type']} (Status: {$request['status']})",
            'timestamp' => $request['created_at'],
            'status' => 'unread'
        ];
    }

    // 4. Recent feedback (excluding admin contact messages)
    $feedbackQuery = "SELECT 
                       feedback_id,
                       message,
                       role,
                       created_at
                     FROM feedback 
                     WHERE type != 'admin_contact' 
                     AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                     ORDER BY created_at DESC 
                     LIMIT 10";
    
    $stmt = $pdo->prepare($feedbackQuery);
    $stmt->execute();
    $recentFeedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentFeedback as $feedback) {
        $activities[] = [
            'id' => 'feedback_' . $feedback['feedback_id'],
            'type' => 'feedback',
            'message' => "New feedback from {$feedback['role']}: " . substr($feedback['message'], 0, 50) . "...",
            'timestamp' => $feedback['created_at'],
            'status' => 'unread'
        ];
    }

    // Sort all activities by timestamp (newest first)
    usort($activities, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Get unread count
    $unreadCount = count(array_filter($activities, function($activity) {
        return $activity['status'] === 'unread';
    }));

    echo json_encode([
        'success' => true,
        'activities' => $activities,
        'unread_count' => $unreadCount
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>