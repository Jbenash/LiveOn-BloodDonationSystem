<?php
require_once '../config/db_connection.php';

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

try {
    $limit = isset($_GET['limit']) ? max(1, min(20, intval($_GET['limit']))) : 10;
    $role = isset($_GET['role']) ? $_GET['role'] : 'all';
    
    // Build query based on role filter
    $whereClause = "WHERE f.approved = 1";
    $params = [];
    
    if ($role !== 'all' && in_array($role, ['hospital', 'donor', 'mro'])) {
        $whereClause .= " AND f.role = ?";
        $params[] = $role;
    }
    
    // Get approved feedback with user details
    $query = "
        SELECT 
            f.feedback_id,
            f.role,
            f.message,
            f.created_at,
            CASE 
                WHEN f.role = 'hospital' THEN h.name
                WHEN f.role = 'donor' THEN CONCAT(d.first_name, ' ', d.last_name)
                WHEN f.role = 'mro' THEN m.officer_name
                ELSE 'Anonymous'
            END as name,
            CASE 
                WHEN f.role = 'hospital' THEN h.location
                WHEN f.role = 'donor' THEN d.city
                WHEN f.role = 'mro' THEN h2.location
                ELSE NULL
            END as location
        FROM feedback f
        LEFT JOIN hospitals h ON f.user_id = h.user_id AND f.role = 'hospital'
        LEFT JOIN donors d ON f.user_id = d.user_id AND f.role = 'donor'
        LEFT JOIN mro_officers m ON f.user_id = m.user_id AND f.role = 'mro'
        LEFT JOIN hospitals h2 ON m.hospital_id = h2.hospital_id AND f.role = 'mro'
        {$whereClause}
        ORDER BY f.created_at DESC
        LIMIT ?
    ";
    
    $params[] = $limit;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data for frontend display
    foreach ($feedbacks as &$feedback) {
        // Format date to be more user-friendly
        $created_date = new DateTime($feedback['created_at']);
        $feedback['formatted_date'] = $created_date->format('M j, Y');
        $feedback['relative_date'] = getRelativeTime($created_date);
        
        // Add role display name
        $feedback['role_display'] = ucfirst($feedback['role']);
        
        // Ensure message is clean for display
        $feedback['message'] = htmlspecialchars($feedback['message'], ENT_QUOTES, 'UTF-8');
        
        // Remove sensitive data
        unset($feedback['created_at']);
    }
    
    echo json_encode([
        'success' => true,
        'feedbacks' => $feedbacks,
        'total' => count($feedbacks),
        'limit' => $limit,
        'role_filter' => $role
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_approved_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in get_approved_feedback.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while fetching feedback']);
}

function getRelativeTime($datetime) {
    $now = new DateTime();
    $interval = $now->diff($datetime);
    
    if ($interval->y > 0) {
        return $interval->y . ' year' . ($interval->y > 1 ? 's' : '') . ' ago';
    } elseif ($interval->m > 0) {
        return $interval->m . ' month' . ($interval->m > 1 ? 's' : '') . ' ago';
    } elseif ($interval->d > 0) {
        return $interval->d . ' day' . ($interval->d > 1 ? 's' : '') . ' ago';
    } elseif ($interval->h > 0) {
        return $interval->h . ' hour' . ($interval->h > 1 ? 's' : '') . ' ago';
    } elseif ($interval->i > 0) {
        return $interval->i . ' minute' . ($interval->i > 1 ? 's' : '') . ' ago';
    } else {
        return 'Just now';
    }
}
?>