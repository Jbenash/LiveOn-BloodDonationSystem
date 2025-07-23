<?php
// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include __DIR__ . '/../config/db_connection.php';

class OTPVerifier
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function verify($email, $enteredOtp)
    {
        // Lookup user_id from email
        $userStmt = $this->pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $userStmt->execute([$email]);
        $user = $userStmt->fetch();
        if (!$user) {
            return ["success" => false, "message" => "User not found"];
        }
        $userId = $user['user_id'];
        $stmt = $this->pdo->prepare("SELECT otp_code, expires_at FROM otp_verification WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        if ($row && $row['otp_code'] === $enteredOtp && strtotime($row['expires_at']) > time()) {
            $updateStmt = $this->pdo->prepare(
                "UPDATE otp_verification SET verified = 1, verified_at = NOW() WHERE user_id = ? AND otp_code = ?"
            );
            $updateStmt->execute([$userId, $enteredOtp]);

            // Fetch registration data from registration_temp
            $regStmt = $this->pdo->prepare("SELECT * FROM registration_temp WHERE reg_id = ?");
            $regStmt->execute([$userId]);
            $regData = $regStmt->fetch();
            if ($regData) {
                // Create user and donor records
                $newUserId = 'US' . uniqid();
                $newDonorId = 'DN' . uniqid();
                $userStmt = $this->pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'donor', 'inactive')");
                $userStmt->execute([$newUserId, $regData['full_name'], $regData['email'], $regData['phone'], $regData['password_hash']]);
                $donorStmt = $this->pdo->prepare("INSERT INTO donors (donor_id, user_id, dob, address, city, preferred_hospital_id, status) VALUES (?, ?, ?, ?, ?, ?, 'not available')");
                $donorStmt->execute([$newDonorId, $newUserId, $regData['dob'], $regData['address'], $regData['city'], $regData['hospital_id']]);
                // Remove temp registration
                $delStmt = $this->pdo->prepare("DELETE FROM registration_temp WHERE reg_id = ?");
                $delStmt->execute([$userId]);
                return ["success" => true];
            } else {
                return ["success" => false, "message" => "Registration data not found."];
            }
        } else {
            return ["success" => false, "message" => "Invalid or expired OTP"];
        }
    }
}

$db = new Database();
$pdo = $db->connect();

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$enteredOtp = $data['otp'] ?? '';

if (!$email || !$enteredOtp) {
    echo json_encode(["success" => false, "message" => "Email and OTP are required"]);
    exit;
}

$verifier = new OTPVerifier($pdo);
$result = $verifier->verify($email, $enteredOtp);
echo json_encode($result);
