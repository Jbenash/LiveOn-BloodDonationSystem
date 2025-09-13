<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    $stmt = $pdo->query('SELECT story_id, title, message, created_at FROM success_stories ORDER BY created_at DESC');
    $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'stories' => $stories]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
