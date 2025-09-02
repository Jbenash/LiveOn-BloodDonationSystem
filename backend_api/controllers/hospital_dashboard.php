<?php
require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

// Require hospital role
requireRole('hospital');

class HospitalDashboard
{
    private $pdo;
    private $hospitalUserId;

    public function __construct($pdo, $hospitalUserId)
    {
        $this->pdo = $pdo;
        $this->hospitalUserId = $hospitalUserId;
    }

    public function handle()
    {
        // Fetch hospital details
        $stmt = $this->pdo->prepare("SELECT hospital_id, name, location, contact_phone FROM hospitals WHERE user_id = ?");
        $stmt->execute([$this->hospitalUserId]);
        $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$hospital) {
            echo json_encode(['error' => 'Hospital not found']);
            exit();
        }

        $hospitalId = $hospital['hospital_id'];

        // Fetch blood inventory (using new blood_id format)
        $inventoryStmt = $this->pdo->prepare("SELECT blood_id, blood_type, units_available FROM blood_inventory WHERE hospital_id = ?");
        $inventoryStmt->execute([$hospitalId]);
        $inventory = $inventoryStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all active donors (both available and not available)
        $donorStmt = $this->pdo->query("
            SELECT d.donor_id, u.name, d.blood_type, u.phone AS contact, d.city AS location, d.last_donation_date AS lastDonation, d.status, d.preferred_hospital_id, h.name AS preferred_hospital_name, u.email, d.donor_image,
                   (
                       SELECT mv.age
                       FROM medical_verifications mv
                       WHERE mv.donor_id = d.donor_id
                       ORDER BY mv.verification_date DESC
                       LIMIT 1
                   ) AS age
            FROM donors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
            WHERE u.status = 'active'
        ");
        $donors = [];
        while ($row = $donorStmt->fetch(PDO::FETCH_ASSOC)) {
            $donors[] = [
                'donor_id' => $row['donor_id'],
                'name' => $row['name'],
                'bloodType' => $row['blood_type'],
                'contact' => $row['contact'],
                'location' => $row['location'],
                'lastDonation' => $row['lastDonation'],
                'status' => $row['status'],
                'preferredHospitalId' => $row['preferred_hospital_id'],
                'preferredHospitalName' => $row['preferred_hospital_name'],
                'email' => $row['email'],
                'age' => $row['age'],
                'profilePic' => $row['donor_image'] ? (strpos($row['donor_image'], 'http') === 0 ? $row['donor_image'] : 'http://localhost/liveonv2/backend_api/' . $row['donor_image']) : null,
            ];
        }

        // Fetch emergency requests log for this hospital
        $emergencyStmt = $this->pdo->prepare("SELECT blood_type, status, required_units, created_at FROM emergency_requests WHERE hospital_id = ? ORDER BY created_at DESC");
        $emergencyStmt->execute([$hospitalId]);
        $emergencyRequests = $emergencyStmt->fetchAll(PDO::FETCH_ASSOC);

        // Final response
        echo json_encode([
            'name' => $hospital['name'],
            'location' => $hospital['location'],
            'contact' => $hospital['contact_phone'],
            'donors' => $donors,
            'bloodInventory' => array_map(function ($row) {
                return [
                    'bloodId' => $row['blood_id'],
                    'type' => $row['blood_type'],
                    'units' => (int)$row['units_available']
                ];
            }, $inventory),
            'emergencyRequests' => array_map(function ($row) {
                $isCritical = ($row['status'] === 'pending' && $row['required_units'] >= 5);
                return [
                    'bloodType' => $row['blood_type'],
                    'status' => $isCritical ? 'Critical' : 'Normal',
                    'requiredUnits' => (int)$row['required_units'],
                    'createdAt' => $row['created_at']
                ];
            }, $emergencyRequests)
        ]);
    }
}

// Authorization is now handled by requireRole('hospital') above

// DB connection and dashboard handler
require_once __DIR__ . '/../config/db_connection.php';
$db = new Database();
$pdo = $db->connect();
$hospitalUserId = $_SESSION['user_id'];

$dashboard = new HospitalDashboard($pdo, $hospitalUserId);
$dashboard->handle();
