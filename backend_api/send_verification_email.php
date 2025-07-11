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

    // Generate PDF donor card using Dompdf
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .card {
                width: 85.6mm; /* Credit card width */
                height: 54mm; /* Credit card height */
                border: 4px solid #dc3545;
                border-radius: 15px;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                position: relative;
                overflow: hidden;
                box-shadow: 0 8px 16px rgba(220, 53, 69, 0.3);
            }
            .header {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                color: white;
                padding: 15px;
                text-align: center;
                font-size: 22px;
                font-weight: bold;
                border-radius: 11px 11px 0 0;
                position: relative;
            }
            .logo {
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 45px;
                color: #dc3545;
                opacity: 0.3;
            }
            .logo:before {
                content: "";
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 12px solid #dc3545;
            }
            .content {
                padding: 20px;
                font-size: 16px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 8px;
            }
            .label {
                font-weight: bold;
                color: #333;
                min-width: 100px;
                font-size: 16px;
            }
            .value {
                color: #dc3545;
                text-align: right;
                flex: 1;
                font-weight: bold;
                font-size: 18px;
            }
            .footer {
                position: absolute;
                bottom: 10px;
                right: 15px;
                font-size: 10px;
                color: #666;
                font-weight: bold;
            }
            .card-number {
                position: absolute;
                bottom: 35px;
                left: 20px;
                font-size: 14px;
                color: #666;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                DONOR CARD
                <div class="logo"><i class="fas fa-tint"></i></div>
            </div>
            <div class="content">
                <div class="info-row">
                    <span class="label">Donor ID:</span>
                    <span class="value">' . htmlspecialchars($input['donor_id']) . '</span>
                </div>
                <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">' . htmlspecialchars($input['full_name']) . '</span>
                </div>
                <div class="info-row">
                    <span class="label">Blood Group:</span>
                    <span class="value">' . htmlspecialchars($input['blood_group']) . '</span>
                </div>
                <div class="info-row">
                    <span class="label">Issued:</span>
                    <span class="value">' . date('d/m/Y') . '</span>
                </div>
            </div>
            <div class="card-number">CARD NO: ' . strtoupper(substr($input['donor_id'], 0, 8)) . '</div>
            <div class="footer">
                LiveOn Blood Donation System
            </div>
        </div>
    </body>
    </html>
    ';
    $dompdf = new \Dompdf\Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A5', 'landscape');
    $dompdf->render();
    $pdfOutput = $dompdf->output();
    $mail->addStringAttachment($pdfOutput, 'DonorCard.pdf');

    $mail->isHTML(true);
    $mail->Subject = 'Your Donor Verification Details';
    $mail->Body = '<h3>Dear ' . htmlspecialchars($input['full_name']) . ',</h3>' .
        '<p>Your donor verification is complete. Here are your details:</p>' .
        '<ul>' .
        '<li><strong>Donor ID:</strong> ' . htmlspecialchars($input['donor_id']) . '</li>' .
        '<li><strong>Full Name:</strong> ' . htmlspecialchars($input['full_name']) . '</li>' .
        '<li><strong>Blood Group:</strong> ' . htmlspecialchars($input['blood_group']) . '</li>' .
        '</ul>' .
        '<p>Thank you for being a lifesaver!</p>';

    $mail->AltBody = "Dear {$input['full_name']},\nYour donor verification is complete.\nDonor ID: {$input['donor_id']}\nFull Name: {$input['full_name']}\nBlood Group: {$input['blood_group']}\nThank you for being a lifesaver!";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mailer Error: ' . $mail->ErrorInfo]);
} 