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

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    $donor_id = $_GET['donor_id'] ?? null;

    if (!$donor_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Donor ID is required']);
        exit;
    }

    // Get redemption history
    $stmt = $pdo->prepare("
        SELECT 
            id,
            redemption_type,
            points_spent,
            redemption_value,
            redemption_code,
            created_at as redemption_date,
            status,
            expiry_date as expires_at
        FROM reward_redemptions 
        WHERE donor_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$donor_id]);
    $redemptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $redemptions
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
