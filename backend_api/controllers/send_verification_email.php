<?php
// Ensure clean JSON output by buffering any unexpected output
ob_start();

require_once __DIR__ . '/../helpers/mro_auth.php';

// Check MRO authentication (includes CORS, session init, and auth check)
$currentUser = checkMROSession();

// Enhanced error logging but disable HTML error display
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML error display for clean JSON
ini_set('log_errors', 1);

require_once dirname(__DIR__, 2) . '/vendor/autoload.php';
require_once __DIR__ . '/../config/db_connection.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Clear any buffered output before sending JSON
ob_clean();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_log("Invalid method: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Email Input Data: " . json_encode($input));

    if (!$input) {
        error_log("Invalid JSON input");
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

    // First check if donor exists in donors table
    $sql = "SELECT donor_card FROM donors WHERE donor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$donor_id]);
    $row = $stmt->fetch();

    if (!$row) {
        error_log('Donor not found in donors table for donor_id: ' . $donor_id);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Donor not found. Make sure medical verification is completed first.']);
        exit();
    }

    $donor_card_path = $row['donor_card'] ?? null;

    if (!$donor_card_path || !file_exists($donor_card_path)) {
        error_log('Donor card PDF not found for donor_id: ' . $donor_id . ' | Path: ' . ($donor_card_path ?? 'NULL'));
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Donor card PDF not found. Medical verification may not be completed yet.']);
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
