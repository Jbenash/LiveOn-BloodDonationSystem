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

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'donor') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    exit();
}

require 'db_connection.php';
$db = new Database();
$pdo = $db->connect();
$donorId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT d.*, u.email, u.name FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.user_id = ?");
$stmt->execute([$donorId]);
$donor = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$donor) {
    echo json_encode(['error' => 'Donor not found']);
    exit();
}

$stmt = $pdo->prepare("SELECT COUNT(*) AS total, MAX(donation_date) AS last FROM donations WHERE donor_id = ?");
$stmt->execute([$donorId]);
$stats = $stmt->fetch();

$totalDonations = $stats['total'];
$lastDonation = $stats['last'] ?? 'N/A';
$nextEligible = $lastDonation !== 'N/A' ? date('Y-m-d', strtotime($lastDonation . ' +6 months')) : 'First Donation';
$livesSaved = $totalDonations * 3;
$points = $totalDonations * 100;
$rank = $totalDonations > 10 ? 'Gold Donor' : ($totalDonations >= 5 ? 'Silver Donor' : 'Bronze Donor');

$response = [
    'name' => $donor['name'],
    'bloodType' => $donor['blood_type'],
    'age' => date_diff(date_create($donor['dob']), date_create('today'))->y,
    'location' => $donor['city'],
    'email' => $donor['email'],
    'profilePic' => 'https://randomuser.me/api/portraits/men/1.jpg',
    'totalDonations' => $totalDonations,
    'lastDonation' => $lastDonation,
    'nextEligible' => $nextEligible,
    'livesSaved' => $livesSaved,
    'points' => $points,
    'rank' => $rank
];

echo json_encode($response);
