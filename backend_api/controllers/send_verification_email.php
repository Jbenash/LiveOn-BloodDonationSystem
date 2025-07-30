<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Error logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../donation_debug.log');
ini_set('display_errors', 0);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// Database connection
$host = 'localhost';
$dbname = 'liveon_db';
$username = 'root';
$password = '';

require_once dirname(__DIR__) . '/vendor/autoload.php';

require_once __DIR__ . '/../config/db_connection.php';
require_once dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/SMTP.php';
require_once dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit();
    }

    $required_fields = ['donor_id', 'email'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit();
        }
    }

    $mail = new PHPMailer(true);
    // SMTP settings (customize as needed)
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'liveonsystem@gmail.com';
    $mail->Password = 'jzjcyywthodnlrew';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    $mail->SMTPDebug = 0;

    $mail->setFrom('liveonsystem@gmail.com', 'LiveOn Team');
    $mail->addAddress($input['email'], $input['full_name']);

    // Test database connection before proceeding
    try {
        $database = new Database();
        $pdo = $database->connect();
    } catch (Throwable $e) {
        error_log('DB connection failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
        exit();
    }

    $donor_id = $input['donor_id'];
    $sql = "SELECT donor_card FROM donors WHERE donor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$donor_id]);
    $row = $stmt->fetch();
    $donor_card_path = $row['donor_card'] ?? null;

    if (!$donor_card_path || !file_exists($donor_card_path)) {
        error_log('Donor card PDF not found for donor_id: ' . $donor_id . ' | Path: ' . $donor_card_path);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Donor card PDF not found for donor_id: ' . $donor_id]);
        exit();
    }

    // Attach the existing donor card PDF file
    $mail->addAttachment($donor_card_path, 'DonorCard.pdf');

    $mail->isHTML(true);
    $mail->Subject = 'Your Donor Card';
    $mail->Body = '<p>Please find your donor card attached.</p>';
    $mail->AltBody = 'Please find your donor card attached.';

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} catch (Throwable $e) {
    error_log('Fatal error in send_verification_email.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error. Please check the logs.']);
}
