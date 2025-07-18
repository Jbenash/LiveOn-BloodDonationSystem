<?php
require_once __DIR__ . '/vendor/autoload.php';
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

$required_fields = ['donor_id', 'full_name', 'blood_group', 'email'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

require __DIR__ . '/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require __DIR__ . '/vendor/phpmailer/phpmailer/src/SMTP.php';
require __DIR__ . '/vendor/phpmailer/phpmailer/src/Exception.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);
try {
    // SMTP settings (customize as needed)
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com'; // Set your SMTP server
    $mail->SMTPAuth = true;
    $mail->Username = 'mbenash961030@gmail.com'; // SMTP username
    $mail->Password = 'gnvequswehjpwqnv'; // SMTP password
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    // Enable SMTP debug output
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = 'error_log';

    $mail->setFrom('mbenash961030@gmail.com', 'LiveOn Team');
    $mail->addAddress($input['email'], $input['full_name']);

    // Fetch donor_card PDF file path from donors table
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "liveon_db";

    // Fetch donor_card PDF file path from donors table
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection error: ' . $conn->connect_error]);
        exit();
    }
    $donor_id = $input['donor_id'];
    $sql = "SELECT donor_card FROM donors WHERE donor_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $donor_id);
    $stmt->execute();
    $stmt->bind_result($donor_card_path);
    $stmt->fetch();
    $stmt->close();
    $conn->close();

    if (!$donor_card_path || !file_exists($donor_card_path)) {
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mailer Error: ' . $mail->ErrorInfo]);
} 