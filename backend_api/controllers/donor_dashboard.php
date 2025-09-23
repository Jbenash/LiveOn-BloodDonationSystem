<?php
// Suppress PHP warnings/errors from breaking JSON output
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

// Check if user is logged in before requiring role
$currentUser = getCurrentUser();
if (!$currentUser || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'SESSION_EXPIRED']);
    exit();
}

// Check if user has donor role
if ($currentUser['role'] !== 'donor') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Donor role required.']);
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
                // Check if they have a pending request
                $stmt = $this->pdo->prepare("SELECT status FROM donor_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$this->donorId]);
                $request = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($request && $request['status'] === 'pending') {
                    echo json_encode([
                        'error' => 'Your donor registration is pending medical verification by our MRO team. You will be notified once your profile is approved.',
                        'status' => 'pending_approval'
                    ]);
                } else {
                    echo json_encode([
                        'error' => 'Donor profile not found. Please contact administrator.',
                        'status' => 'profile_missing'
                    ]);
                }
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

        // Use next_eligible_date from database if available, otherwise calculate based on 56 days
        if (!empty($donor['next_eligible_date'])) {
            $nextEligible = $donor['next_eligible_date'];
        } else if ($lastDonation !== 'N/A') {
            // Calculate based on 56 days (8 weeks) for whole blood donation
            $nextEligible = date('Y-m-d', strtotime($lastDonation . ' +56 days'));
        } else {
            $nextEligible = 'First Donation';
        }
        $livesSaved = $totalDonations * 3; // Calculate lives saved as 3 times total donations

        // Get actual points from donor_rewards table
        $stmt = $this->pdo->prepare("SELECT current_points FROM donor_rewards WHERE donor_id = ?");
        $stmt->execute([$donor['donor_id']]);
        $rewardsData = $stmt->fetch(PDO::FETCH_ASSOC);
        $points = $rewardsData ? $rewardsData['current_points'] : 0;

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
            'profilePic' => !empty($donor['donor_image']) ? ('http://localhost/liveonv2/' . $donor['donor_image']) : null,
            'totalDonations' => $totalDonations,
            'lastDonation' => $lastDonation,
            'nextEligible' => $nextEligible,
            'livesSaved' => $livesSaved,
            'points' => $points,
            'rank' => $rank,
            'registrationDate' => $registrationDate,
            'donorStatus' => $donor['status'] // Add donor status (available/not available)
        ];

        echo json_encode($response);
    }
}

require_once __DIR__ . '/../config/db_connection.php';
$db = new Database();
$pdo = $db->connect();
$donorId = $_SESSION['user_id'];

// First check if user exists and is donor (allow inactive users to login)
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ? AND role = 'donor' AND status != 'rejected'");
$stmt->execute([$donorId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['error' => 'User not found or access denied']);
    http_response_code(401);
    exit();
}

$dashboard = new DonorDashboard($pdo, $donorId);
$dashboard->handle();
