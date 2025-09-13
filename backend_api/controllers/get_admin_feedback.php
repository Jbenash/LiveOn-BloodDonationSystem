<?php
require_once '../config/db_connection.php';
require_once '../config/session_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $role = isset($_GET['role']) ? $_GET['role'] : 'all';
    
    // Build query based on filters
    $whereClause = "WHERE 1=1";
    $params = [];
    
    if ($status !== 'all') {
        if ($status === 'pending') {
            $whereClause .= " AND f.approved = 0";
        } elseif ($status === 'approved') {
            $whereClause .= " AND f.approved = 1";
        } elseif ($status === 'rejected') {
            $whereClause .= " AND f.approved = -1";
        }
    }
    
    if ($role !== 'all') {
        $whereClause .= " AND f.role = ?";
        $params[] = $role;
    }
    
    // Get feedback with user details
    $query = "
        SELECT 
            f.feedback_id,
            f.user_id,
            f.role,
            f.message,
            f.created_at,
            f.approved,
            u.full_name as user_name,
            u.email as user_email,
            CASE 
                WHEN f.role = 'hospital' THEN h.name
                WHEN f.role = 'donor' THEN CONCAT(d.first_name, ' ', d.last_name)
                WHEN f.role = 'mro' THEN m.officer_name
                ELSE u.full_name
            END as organization_name
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.user_id
        LEFT JOIN hospitals h ON f.user_id = h.user_id AND f.role = 'hospital'
        LEFT JOIN donors d ON f.user_id = d.user_id AND f.role = 'donor'
        LEFT JOIN mro_officers m ON f.user_id = m.user_id AND f.role = 'mro'
        {$whereClause}
        ORDER BY 
            CASE f.approved
                WHEN 0 THEN 1  -- Pending first
                WHEN 1 THEN 2  -- Approved second
                WHEN -1 THEN 3 -- Rejected last
            END,
            f.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data
    foreach ($feedbacks as &$feedback) {
        $feedback['status'] = $feedback['approved'] == 1 ? 'approved' : 
                             ($feedback['approved'] == -1 ? 'rejected' : 'pending');
        
        // Format dates
        $feedback['created_at'] = date('Y-m-d H:i:s', strtotime($feedback['created_at']));
        
        // Truncate message for list view
        $feedback['message_preview'] = strlen($feedback['message']) > 100 ? 
            substr($feedback['message'], 0, 100) . '...' : $feedback['message'];
    }
    
    echo json_encode([
        'success' => true,
        'feedbacks' => $feedbacks,
        'total' => count($feedbacks),
        'filters' => [
            'status' => $status,
            'role' => $role
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_admin_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in get_admin_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while fetching feedback']);
}
?>