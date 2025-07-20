<?php
// CORS HEADERS MUST BE FIRST!
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight (OPTIONS) requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// NOW require dependencies
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db_connection.php';

use Dompdf\Dompdf;

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $pdo = $database->connect();

    $data = json_decode(file_get_contents('php://input'), true);

    $donor_id = $data['donor_id'] ?? null;
    $mro_id = $data['mro_id'] ?? null;
    $height_cm = $data['height_cm'] ?? null;
    $weight_kg = $data['weight_kg'] ?? null;
    $medical_history = $data['medical_history'] ?? null;
    $doctor_notes = $data['doctor_notes'] ?? null;
    $verification_date = $data['verification_date'] ?? null;
    $blood_group = $data['blood_group'] ?? null;
    $age = $data['age'] ?? null;
    $full_name = $data['full_name'] ?? '';

    if (!$donor_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing donor_id"]);
        exit();
    }
    if (!$mro_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing mro_id"]);
        exit();
    }

    // Start transaction
    $pdo->beginTransaction();

    try {
        // Generate a unique verification_id (e.g., 'MV' + uniqid())
        $verification_id = 'MV' . substr(uniqid(), -8);

        // Insert into medical_verifications table
        $sql = "INSERT INTO medical_verifications (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$verification_id, $donor_id, $mro_id, $height_cm, $weight_kg, $medical_history, $doctor_notes, $verification_date, $age]);

        // Update users table to set status to 'active'
        // First get the user_id from donors table
        $sql2 = "SELECT user_id FROM donors WHERE donor_id = ?";
        $stmt2 = $pdo->prepare($sql2);
        $stmt2->execute([$donor_id]);
        $row = $stmt2->fetch();

        if (!$row) {
            throw new Exception("Donor not found");
        }

        $user_id = $row['user_id'];

        // Update users table status to 'active'
        $sql3 = "UPDATE users SET status = 'active' WHERE user_id = ?";
        $stmt3 = $pdo->prepare($sql3);
        $stmt3->execute([$user_id]);

        // Update donors table status to 'available' and blood_type
        $sql4 = "UPDATE donors SET status = 'available', blood_type = ? WHERE donor_id = ?";
        $stmt4 = $pdo->prepare($sql4);
        $stmt4->execute([$blood_group, $donor_id]);

        // Insert notification for donor verification
        $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
        $notifStmt->execute([$user_id, "Donor verified: $donor_id", 'success', 'unread']);

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
                <div class="donor-card-title">LIVEON</div>
                <div class="donor-card-subtitle">Blood Donor Card</div>
                <hr class="donor-card-divider">
                <table class="donor-card-table">
                    <tr>
                        <td class="label">Donor ID:</td>
                        <td class="value">' . $donor_id . '</td>
                    </tr>
                    <tr>
                        <td class="label">Full Name:</td>
                        <td class="value">' . htmlspecialchars($full_name) . '</td>
                    </tr>
                    <tr>
                        <td class="label">Blood Type:</td>
                        <td class="value">' . $blood_group . '</td>
                    </tr>
                    <tr>
                        <td class="label">Verification Date:</td>
                        <td class="value">' . $verification_date . '</td>
                    </tr>
                </table>
                <div class="donor-card-thankyou">
                    <strong>Thank you for being a lifesaver!</strong><br>
                    Your commitment to blood donation helps save countless lives.
                </div>
                <div class="donor-card-footer">
                    This card is valid for blood donation purposes.<br>
                    Please carry this card when visiting blood donation centers.
                </div>
            </div>
        </body>
        </html>';

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // Create uploads directory if it doesn't exist
        $uploadDir = dirname(__DIR__) . '/uploads/donor_cards/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Generate filename with timestamp
        $filename = 'donor_card_' . $donor_id . '_' . date('Y-m-d_H-i-s') . '.pdf';
        $filepath = $uploadDir . $filename;

        // Save PDF to file
        file_put_contents($filepath, $dompdf->output());

        // Update donors table with donor_card PDF path
        $sqlUpdateCard = "UPDATE donors SET donor_card = ? WHERE donor_id = ?";
        $stmtUpdateCard = $pdo->prepare($sqlUpdateCard);
        $stmtUpdateCard->execute([$filepath, $donor_id]);

        // Commit transaction
        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Medical verification saved successfully",
            "pdf_path" => 'uploads/donor_cards/' . $filename
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}
