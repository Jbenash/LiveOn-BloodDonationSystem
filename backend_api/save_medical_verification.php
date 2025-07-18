<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;

$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liveon_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$donor_id = $data['donor_id'] ?? null;
$mro_id = 'MRO001'; // Always use MRO001 as the default value
$height_cm = $data['height_cm'] ?? null;
$weight_kg = $data['weight_kg'] ?? null;
$medical_history = $data['medical_history'] ?? null;
$doctor_notes = $data['doctor_notes'] ?? null;
$verification_date = $data['verification_date'] ?? null;
$blood_group = $data['blood_group'] ?? null;
$age = $data['age'] ?? null;

if (!$donor_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing donor_id"]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // Generate a unique verification_id (e.g., 'MV' + uniqid())
    $verification_id = 'MV' . substr(uniqid(), -8);

    // Insert into medical_verifications table
    $sql = "INSERT INTO medical_verifications (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param('sssssssss', $verification_id, $donor_id, $mro_id, $height_cm, $weight_kg, $medical_history, $doctor_notes, $verification_date, $age);

    if (!$stmt->execute()) {
        throw new Exception("Insert failed: " . $stmt->error);
    }
    $stmt->close();

    // Update users table to set status to 'active'
    // First get the user_id from donors table
    $sql2 = "SELECT user_id FROM donors WHERE donor_id = ?";
    $stmt2 = $conn->prepare($sql2);
    if (!$stmt2) {
        throw new Exception("Prepare failed for user lookup: " . $conn->error);
    }
    $stmt2->bind_param('s', $donor_id);

    if (!$stmt2->execute()) {
        throw new Exception("User lookup failed: " . $stmt2->error);
    }

    $result = $stmt2->get_result();
    if ($result->num_rows === 0) {
        throw new Exception("Donor not found");
    }

    $row = $result->fetch_assoc();
    $user_id = $row['user_id'];
    $stmt2->close();

    // Update users table status to 'active'
    $sql3 = "UPDATE users SET status = 'active' WHERE user_id = ?";
    $stmt3 = $conn->prepare($sql3);
    if (!$stmt3) {
        throw new Exception("Prepare failed for user update: " . $conn->error);
    }
    $stmt3->bind_param('s', $user_id);

    if (!$stmt3->execute()) {
        throw new Exception("User update failed: " . $stmt3->error);
    }
    $stmt3->close();

    // Update donors table status to 'available' and blood_type
    $sql4 = "UPDATE donors SET status = 'available', blood_type = ? WHERE donor_id = ?";
    $stmt4 = $conn->prepare($sql4);
    if (!$stmt4) {
        throw new Exception("Prepare failed for donor update: " . $conn->error);
    }
    $stmt4->bind_param('ss', $blood_group, $donor_id);
    if (!$stmt4->execute()) {
        throw new Exception("Donor update failed: " . $stmt4->error);
    }
    $stmt4->close();

    // Generate donor card PDF
    // (Dompdf is already imported at the top)
    $dompdf = new Dompdf();
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
            }
            .donor-card-container {
                border: 3px solid #dc3545;
                border-radius: 16px;
                max-width: 700px;
                margin: 30px auto;
                padding: 32px 24px 24px 24px;
                background: #fff;
            }
            .donor-card-title {
                text-align: center;
                color: #dc3545;
                font-size: 2.2rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            .donor-card-subtitle {
                text-align: center;
                font-size: 1.1rem;
                color: #444;
                margin-bottom: 1.2rem;
            }
            .donor-card-divider {
                border: none;
                border-top: 3px dashed #dc3545;
                margin: 18px 0 28px 0;
            }
            .donor-card-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0 10px;
                margin-bottom: 32px;
            }
            .donor-card-table td {
                padding: 8px 12px;
                font-size: 1.13rem;
            }
            .donor-card-table .label {
                font-weight: bold;
                color: #222;
                width: 160px;
                text-align: right;
            }
            .donor-card-table .value {
                background: #fde8ea;
                color: #b91c1c;
                font-weight: bold;
                border-radius: 4px;
                min-width: 220px;
                text-align: left;
            }
            .donor-card-thankyou {
                text-align: center;
                margin-top: 18px;
                font-size: 1.13rem;
                color: #222;
            }
            .donor-card-thankyou strong {
                color: #dc3545;
                font-weight: bold;
            }
            .donor-card-footer {
                text-align: center;
                color: #888;
                font-size: 0.98rem;
                margin-top: 32px;
            }
        </style>
    </head>
    <body>
    <div class="donor-card-container">
        <div class="donor-card-title">LiveOn - Blood Donor Card</div>
        <div class="donor-card-subtitle">"You are a lifesaver!"</div>
        <hr class="donor-card-divider" />
        <table class="donor-card-table">
            <tr><td class="label">Donor Name:</td><td class="value">' . htmlspecialchars($data['full_name'] ?? '') . '</td></tr>
            <tr><td class="label">Blood Group:</td><td class="value">' . htmlspecialchars($blood_group) . '</td></tr>
            <tr><td class="label">Registration Date:</td><td class="value">' . ($verification_date ? htmlspecialchars($verification_date) : date('Y-m-d')) . '</td></tr>
            <tr><td class="label">Donor ID:</td><td class="value">' . htmlspecialchars($donor_id) . '</td></tr>
        </table>
        <div class="donor-card-thankyou">Thank you for your generous registration.<br><strong>You truly save lives!</strong></div>
        <div class="donor-card-footer">This card was auto-generated by the LiveOn Blood Donation System.</div>
    </div>
    </body>
    </html>';

    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    $pdfOutput = $dompdf->output();

    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/uploads/donor_cards/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename
    $filename = 'donor_card_' . $donor_id . '_' . date('Y-m-d_H-i-s') . '.pdf';
    $filepath = $uploadDir . $filename;

    // Save PDF as file
    if (file_put_contents($filepath, $pdfOutput) === false) {
        throw new Exception("Failed to save PDF file");
    }

    // Save PDF file path to donors table
    $sql5 = "UPDATE donors SET donor_card = ? WHERE donor_id = ?";
    $stmt5 = $conn->prepare($sql5);
    if (!$stmt5) {
        throw new Exception("Prepare failed for PDF update: " . $conn->error);
    }
    $stmt5->bind_param('ss', $filepath, $donor_id);
    if (!$stmt5->execute()) {
        throw new Exception("PDF update failed: " . $stmt5->error);
    }
    $stmt5->close();

    // Commit transaction
    $conn->commit();

    echo json_encode(["success" => true, "verification_id" => $verification_id, "user_status_updated" => true]);
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();