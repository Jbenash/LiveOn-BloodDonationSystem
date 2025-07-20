<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db_connection.php';
try {
    $database = new Database();
    $pdo = $database->connect();
    // Fetch feedbacks with donor name or hospital name as appropriate
    $sql = "
        SELECT f.message, f.role, f.user_id, f.created_at,
            CASE 
                WHEN f.role = 'donor' THEN u.name
                ELSE NULL
            END AS donor_name,
            CASE 
                WHEN f.role = 'hospital' THEN h.name
                WHEN f.role = 'mro' THEN h2.name
                ELSE NULL
            END AS hospital_name
        FROM feedback f
        LEFT JOIN users u ON f.role = 'donor' AND f.user_id = u.user_id
        LEFT JOIN hospitals h ON f.role = 'hospital' AND f.user_id = h.user_id
        LEFT JOIN mro_officers m ON f.role = 'mro' AND f.user_id = m.user_id
        LEFT JOIN hospitals h2 ON m.hospital_id = h2.hospital_id
        ORDER BY f.created_at DESC
    ";
    $stmt = $pdo->query($sql);
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'feedbacks' => $feedbacks]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
