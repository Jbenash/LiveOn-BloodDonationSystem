<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/db_connection.php';

setCorsHeaders();
handlePreflight();
initSession();
requireRole('hospital');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$bloodId = $data['blood_id'] ?? null;
$change = $data['change'] ?? null;

if (!$bloodId || !is_numeric($change)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid parameters']);
    exit();
}

$db = new Database();
$pdo = $db->connect();

// Get hospital id from session
$hospitalUserId = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT hospital_id FROM hospitals WHERE user_id = ?');
$stmt->execute([$hospitalUserId]);
$hospital = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$hospital) {
    http_response_code(403);
    echo json_encode(['error' => 'Hospital not found']);
    exit();
}
$hospitalId = $hospital['hospital_id'];

// Update blood inventory only for this hospital
$updateStmt = $pdo->prepare('UPDATE blood_inventory SET units_available = units_available + ? WHERE blood_id = ? AND hospital_id = ?');
$updateStmt->execute([$change, $bloodId, $hospitalId]);

if ($updateStmt->rowCount() > 0) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Update failed or no change made']);
}
