<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'liveon_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $donorId = $_GET['donor_id'] ?? null;
    if (!$donorId) {
        echo json_encode(['success' => false, 'error' => 'Missing donor_id']);
        exit();
    }

    $sql = "SELECT d.donation_id, d.donor_id, d.blood_type, d.units_donated, d.donation_date, d.hospital_id
            FROM donations d
            WHERE d.donor_id = ?
            ORDER BY d.donation_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$donorId]);
    $donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'donations' => $donations]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} 