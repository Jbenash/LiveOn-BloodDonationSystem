<?php
header('Content-Type: application/json');
// Allow both development ports
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'http://localhost:5173' || $origin === 'http://localhost:5174') {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
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

    // Fetch admin contact messages from feedback table
    $query = "SELECT 
                f.feedback_id as id,
                u.name,
                u.email,
                f.message,
                f.created_at,
                CASE WHEN f.approved = 1 THEN 'read' ELSE 'unread' END as status
              FROM feedback f
              LEFT JOIN users u ON f.user_id = u.user_id
              WHERE f.role IN ('donor', 'hospital', 'mro')
              ORDER BY f.created_at DESC 
              LIMIT 50";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get unread count
    $unreadQuery = "SELECT COUNT(*) as unread_count 
                    FROM feedback 
                    WHERE approved = 0 AND role IN ('donor', 'hospital', 'mro')";
    $unreadStmt = $pdo->prepare($unreadQuery);
    $unreadStmt->execute();
    $unreadResult = $unreadStmt->fetch(PDO::FETCH_ASSOC);
    $unreadCount = $unreadResult['unread_count'];



    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'unread_count' => $unreadCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
