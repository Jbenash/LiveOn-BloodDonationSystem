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

// Check authentication first
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'donor') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    exit();
}

class DonorDashboard
{
    private $pdo;
    private $donorId;

    public function __construct($pdo, $donorId)
    {
        $this->pdo = $pdo;
        $this->donorId = $donorId;
    }

    public function handle()
    {
        $stmt = $this->pdo->prepare("SELECT d.*, u.email, u.name FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.user_id = ?");
        $stmt->execute([$this->donorId]);
        $donor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$donor) {
            // Check if user exists but no donor record
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE user_id = ? AND role = 'donor'");
            $stmt->execute([$this->donorId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                echo json_encode(['error' => 'Donor profile not found. Please contact administrator.']);
            } else {
                echo json_encode(['error' => 'Donor not found']);
            }
            exit();
        }

        // Count total donations from donations table for this donor
        $stmt = $this->pdo->prepare("SELECT COUNT(*) AS total FROM donations WHERE donor_id = ?");
        $stmt->execute([$donor['donor_id']]);
        $stats = $stmt->fetch();
        $totalDonations = $stats['total'];

        $lastDonation = !empty($donor['last_donation_date']) ? $donor['last_donation_date'] : 'N/A';
        $nextEligible = $lastDonation !== 'N/A' ? date('Y-m-d', strtotime($lastDonation . ' +6 months')) : 'First Donation';
        $livesSaved = isset($donor['lives_saved']) ? $donor['lives_saved'] : 0;
        $points = $totalDonations * 100;
        $rank = $totalDonations > 10 ? 'Gold Donor' : ($totalDonations >= 5 ? 'Silver Donor' : 'Bronze Donor');

        // Fetch age from the latest medical_verifications record for this donor
        $stmt = $this->pdo->prepare("SELECT age FROM medical_verifications WHERE donor_id = ? ORDER BY verification_date DESC LIMIT 1");
        $stmt->execute([$donor['donor_id']]);
        $med = $stmt->fetch(PDO::FETCH_ASSOC);
        $age = $med ? $med['age'] : null;

        // Fetch registration date (earliest verification_date)
        $stmt = $this->pdo->prepare("SELECT verification_date FROM medical_verifications WHERE donor_id = ? ORDER BY verification_date ASC LIMIT 1");
        $stmt->execute([$donor['donor_id']]);
        $reg = $stmt->fetch(PDO::FETCH_ASSOC);
        $registrationDate = $reg ? $reg['verification_date'] : null;

        $response = [
            'donorId' => $donor['donor_id'],
            'name' => $donor['name'],
            'bloodType' => $donor['blood_type'],
            'age' => $age,
            'location' => $donor['city'],
            'email' => $donor['email'],
            'profilePic' => !empty($donor['donor_image']) ? ('http://localhost/liveonv2/' . $donor['donor_image']) : 'https://randomuser.me/api/portraits/men/1.jpg',
            'totalDonations' => $totalDonations,
            'lastDonation' => $lastDonation,
            'nextEligible' => $nextEligible,
            'livesSaved' => $livesSaved,
            'points' => $points,
            'rank' => $rank,
            'registrationDate' => $registrationDate
        ];

        echo json_encode($response);
    }
}

require_once __DIR__ . '/../config/db_connection.php';
$db = new Database();
$pdo = $db->connect();
$donorId = $_SESSION['user_id'];

// First check if user exists and is active
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ? AND role = 'donor' AND status = 'active'");
$stmt->execute([$donorId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['error' => 'User not found or not active']);
    http_response_code(401);
    exit();
}

$dashboard = new DonorDashboard($pdo, $donorId);
$dashboard->handle();
