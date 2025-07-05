<?php
header("Access-Control-Allow-Origin: *");  // Allow all origins (for dev only)
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'db_connection.php';

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
        $userStmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $userStmt->execute([$email]);
        $user = $userStmt->fetch();
        if (!$user) {
            return ["success" => false, "message" => "User not found"];
        }
        $userId = $user['id'];
        $stmt = $this->pdo->prepare("SELECT otp_code, expires_at FROM otp_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        if ($row && $row['otp_code'] === $enteredOtp && strtotime($row['expires_at']) > time()) {
            $updateStmt = $this->pdo->prepare(
                "UPDATE otp_verifications SET verified_at = NOW() WHERE user_id = ? AND otp_code = ?"
            );
            $updateStmt->execute([$userId, $enteredOtp]);
            return ["success" => true];
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
