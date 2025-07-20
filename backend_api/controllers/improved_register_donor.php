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

require 'vendor/autoload.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/Donor.php';
require_once __DIR__ . '/../services/DonorService.php';

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

    public function sendOTP(string $toEmail, string $toName, string $otp): bool
    {
        try {
            $this->mail->setFrom('mbenash961030@gmail.com', 'LiveOn System');
            $this->mail->addAddress($toEmail, $toName);
            $this->mail->Subject = 'LiveOn Registration OTP';
            $this->mail->Body = "<h3>Hello $toName,</h3><p>Your OTP for completing your LiveOn registration is:</p><h2>$otp</h2><p>This code will expire in 10 minutes.</p><br><p>Regards,<br>LiveOn Team</p>";
            $this->mail->send();
            return true;
        } catch (Exception $e) {
            throw new Exception("Email could not be sent. Mailer Error: {$e->getMessage()}");
        }
    }
}

class OTPManager
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function generateAndStore(string $userId): string
    {
        try {
            $otp = rand(100000, 999999);
            $expiration = date("Y-m-d H:i:s", strtotime("+10 minutes"));

            $stmt = $this->pdo->prepare("INSERT INTO otp_verification (user_id, otp_code, expires_at, verified) VALUES (?, ?, ?, 0)");
            $stmt->execute([$userId, $otp, $expiration]);

            return $otp;
        } catch (PDOException $e) {
            throw new Exception("OTP generation failed: " . $e->getMessage());
        }
    }
}

class RegistrationController
{
    private $donorService;
    private $mailer;
    private $otpManager;

    public function __construct(PDO $pdo)
    {
        $this->donorService = new DonorService($pdo);
        $this->mailer = new Mailer();
        $this->otpManager = new OTPManager($pdo);
    }

    public function registerDonor(array $data): array
    {
        try {
            // Validate required fields
            $requiredFields = ['fullName', 'email', 'password', 'dob', 'address', 'city', 'phone', 'hospitalId'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return ['success' => false, 'message' => "Missing required field: $field"];
                }
            }

            // Register donor using service
            $result = $this->donorService->registerDonor($data);

            if (!$result['success']) {
                return $result;
            }

            // Generate and store OTP
            $otp = $this->otpManager->generateAndStore($result['user_id']);

            // Send OTP email
            $this->mailer->sendOTP($data['email'], $data['fullName'], $otp);

            return ['success' => true, 'message' => 'Registration successful. Please check your email for OTP.'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
        }
    }
}

// Main execution
try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "message" => "Invalid JSON data"]);
        exit;
    }

    // Initialize database connection
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    // Initialize controller
    $controller = new RegistrationController($pdo);

    // Process registration
    $result = $controller->registerDonor($data);

    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
