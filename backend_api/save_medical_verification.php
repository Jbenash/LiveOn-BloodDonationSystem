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
    $sql = "INSERT INTO medical_verifications (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param('ssssssss', $verification_id, $donor_id, $mro_id, $height_cm, $weight_kg, $medical_history, $doctor_notes, $verification_date);

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
    $dompdf = new Dompdf();
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
            }
            .card {
                width: 85.6mm; /* Credit card width */
                height: 54mm;   /* Credit card height */
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
                <span class="value">' . htmlspecialchars($donor_id) . '</span>
            </div>
            <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">' . htmlspecialchars($data['full_name'] ?? '') . '</span>
            </div>
            <div class="info-row">
                <span class="label">Blood Group:</span>
                <span class="value">' . htmlspecialchars($blood_group) . '</span>
            </div>
            <div class="info-row">
                <span class="label">Issued:</span>
                <span class="value">' . date('d/m/Y') . '</span>
            </div>
        </div>
        <div class="card-number">CARD NO: ' . strtoupper(substr($donor_id, 0, 8)) . '</div>
        <div class="footer">
            LiveOn Blood Donation System
        </div>
    </div>
    </body>
    </html>';
    
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A5', 'landscape');
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
