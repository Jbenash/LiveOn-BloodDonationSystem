<?php
header("Access-Control-Allow-Origin: *");  // Allow all origins (for dev only)
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';
include 'db_connection.php';

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
    public function generateAndStore($email)
    {
        $otp = rand(100000, 999999);
        $expiresAt = date("Y-m-d H:i:s", strtotime("+10 minutes"));
        $stmt = $this->pdo->prepare("INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $otp, $expiresAt]);
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
        $check = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        return $check->rowCount() > 0;
    }
    public function registerUser($email, $password)
    {
        $stmt = $this->pdo->prepare("INSERT INTO users (email, password, role, status) VALUES (?, ?, 'donor', 'pending')");
        $stmt->execute([$email, $password]);
        return $this->pdo->lastInsertId();
    }
    public function registerDonor($userId, $fullName, $email)
    {
        $stmt = $this->pdo->prepare("INSERT INTO donors (user_id, full_name, email, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([$userId, $fullName, $email]);
    }
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['fullName'], $data['email'], $data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing or invalid data"]);
    exit;
}

$db = new Database();
$pdo = $db->connect();
$donorReg = new DonorRegistration($pdo);
$otpManager = new OTPManager($pdo);
$mailer = new Mailer();

$fullName = $data['fullName'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_BCRYPT);

if ($donorReg->isEmailRegistered($email)) {
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    exit;
}

$userId = $donorReg->registerUser($email, $password);
$donorReg->registerDonor($userId, $fullName, $email);
$otp = $otpManager->generateAndStore($email);

try {
    $mailer->sendOTP($email, $fullName, $otp);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Email could not be sent. Mailer Error: {$e->getMessage()}"]);
}
