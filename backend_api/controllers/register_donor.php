<?php
// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';
include __DIR__ . '/../config/db_connection.php';

class Mailer
{
    private $mail;
    public function __construct()
    {
        $this->mail = new PHPMailer(true);
        $this->mail->isSMTP();
        $this->mail->Host = 'smtp.gmail.com';
        $this->mail->SMTPAuth = true;
        $this->mail->Username = 'mbenash961030@gmail.com';
        $this->mail->Password = 'gnvequswehjpwqnv';
        $this->mail->SMTPSecure = 'tls';
        $this->mail->Port = 587;
        $this->mail->isHTML(true);
    }
    public function sendOTP($toEmail, $toName, $otp)
    {
        $this->mail->setFrom('mbenash961030@gmail.com', 'LiveOn System');
        $this->mail->addAddress($toEmail, $toName);
        $this->mail->Subject = 'LiveOn Registration OTP';
        $this->mail->Body = "<h3>Hello $toName,</h3><p>Your OTP for completing your LiveOn registration is:</p><h2>$otp</h2><p>This code will expire in 10 minutes.</p><br><p>Regards,<br>LiveOn Team</p>";
        $this->mail->send();
    }
}

class OTPManager
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function generateAndStore($userId)
    {
        $otp = rand(100000, 999999);
        $expiration = date("Y-m-d H:i:s", strtotime("+10 minutes"));
        $stmt = $this->pdo->prepare("INSERT INTO otp_verification (user_id, otp_code, expires_at, verified) VALUES (?, ?, ?, 0)");
        $stmt->execute([$userId, $otp, $expiration]);
        return $otp;
    }
}

class DonorRegistration
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function isEmailRegistered($email)
    {
        $check = $this->pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $check->execute([$email]);
        return $check->rowCount() > 0;
    }
    public function registerUser($userId, $name, $email, $phone, $passwordHash)
    {
        $stmt = $this->pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'donor', 'inactive')");
        $stmt->execute([$userId, $name, $email, $phone, $passwordHash]);
    }
    public function registerDonor($donorId, $userId, $dob, $address, $city, $preferredHospitalId)
    {
        $stmt = $this->pdo->prepare("INSERT INTO donors (donor_id, user_id, dob, address, city, preferred_hospital_id, status) VALUES (?, ?, ?, ?, ?, ?, 'not available')");
        $stmt->execute([$donorId, $userId, $dob, $address, $city, $preferredHospitalId]);
    }
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['fullName'], $data['email'], $data['password'], $data['dob'], $data['address'], $data['city'], $data['phone'], $data['hospitalId'])) {
    echo json_encode(["success" => false, "message" => "Missing or invalid data"]);
    exit;
}

$db = new Database();
$pdo = $db->connect();
$donorReg = new DonorRegistration($pdo);
$otpManager = new OTPManager($pdo);
$mailer = new Mailer();

$fullName = $data['fullName'];
$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
$dob = $data['dob'];
$address = $data['address'];
$city = $data['city'];
$phone = preg_replace('/\D/', '', $data['phone']); // Remove non-digits
$preferredHospitalId = $data['hospitalId'];

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}
// Phone validation (Sri Lankan: exactly 10 digits)
if (!preg_match('/^\d{10}$/', $phone)) {
    echo json_encode(["success" => false, "message" => "Phone number must be exactly 10 digits."]);
    exit;
}

if ($donorReg->isEmailRegistered($email)) {
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    exit;
}

$userId = 'US' . uniqid();
$donorId = 'DN' . uniqid();
$donorReg->registerUser($userId, $fullName, $email, $phone, $passwordHash);
$donorReg->registerDonor($donorId, $userId, $dob, $address, $city, $preferredHospitalId);
$otp = $otpManager->generateAndStore($userId);

// Insert notification for new donor registration
$notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
$notifStmt->execute([$userId, "New donor registered: $fullName", 'info', 'unread']);

try {
    $mailer->sendOTP($email, $fullName, $otp);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Email could not be sent. Mailer Error: {$e->getMessage()}"]);
}
