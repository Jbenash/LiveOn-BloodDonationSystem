<?php
session_start();
// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'hospital') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    exit();
}

require 'db_connection.php';
$db = new Database();
$pdo = $db->connect();
$hospitalUserId = $_SESSION['user_id'];

// Get hospital_id from hospitals table using user_id
$stmt = $pdo->prepare("SELECT hospital_id, name FROM hospitals WHERE user_id = ?");
$stmt->execute([$hospitalUserId]);
$hospital = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$hospital) {
    echo json_encode(['error' => 'Hospital not found']);
    exit();
}
$hospitalId = $hospital['hospital_id'];

// Fetch blood inventory for this hospital
$inventoryStmt = $pdo->prepare("SELECT blood_type, units_available FROM blood_inventory WHERE hospital_id = ?");
$inventoryStmt->execute([$hospitalId]);
$inventoryRows = $inventoryStmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate percent for each blood type (assuming max 20 units for 100%)
$bloodInventory = array_map(function ($row) {
    return [
        'type' => $row['blood_type'],
        'units' => (int)$row['units_available']
    ];
}, $inventoryRows);

// Fetch all approved donors (common for all hospitals)
$donorStmt = $pdo->query("SELECT d.donor_id, u.name, d.blood_type, u.phone as contact, d.city as location, d.last_donation_date as lastDonation, d.status FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.status = 'approved'");
$donors = [];
while ($donor = $donorStmt->fetch(PDO::FETCH_ASSOC)) {
    $donors[] = [
        'name' => $donor['name'],
        'bloodType' => $donor['blood_type'],
        'contact' => $donor['contact'],
        'location' => $donor['location'],
        'lastDonation' => $donor['lastDonation'],
        'status' => ($donor['status'] === 'approved' ? 'Available' : 'Unavailable')
    ];
}

$response = [
    'name' => $hospital['name'],
    'donors' => $donors,
    'bloodInventory' => $bloodInventory
];

echo json_encode($response);
