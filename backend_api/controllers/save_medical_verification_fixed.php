<?php
// Set CORS headers first - BEFORE any other processing
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight request IMMEDIATELY
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../helpers/mro_auth.php';

    // Check MRO authentication (includes session init and auth check)
    $currentUser = checkMROSession();

    // NOW require dependencies
    require_once __DIR__ . '/../../vendor/autoload.php';
    require_once __DIR__ . '/../config/db_connection.php';

    // Log the start of the process
    error_log("=== Medical Verification Debug Start ===");
    error_log("Current User: " . json_encode($currentUser));
    error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);

    $database = new Database();
    $pdo = $database->connect();
    error_log("Database connection successful");

    $data = json_decode(file_get_contents('php://input'), true);
    error_log("Request Data: " . json_encode($data));

    // Validate required fields
    $requiredFields = ['donor_id', 'mro_id', 'height_cm', 'weight_kg', 'verification_date', 'blood_group', 'age', 'full_name'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        error_log("Missing required fields: " . implode(', ', $missingFields));
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Missing required fields: " . implode(', ', $missingFields)
        ]);
        exit();
    }

    $donor_id = $data['donor_id'];
    $mro_id = $data['mro_id'];
    $height_cm = $data['height_cm'];
    $weight_kg = $data['weight_kg'];
    $medical_history = $data['medical_history'] ?? '';
    $doctor_notes = $data['doctor_notes'] ?? '';
    $verification_date = $data['verification_date'];
    $blood_group = $data['blood_group'];
    $age = $data['age'];
    $full_name = $data['full_name'];

    error_log("Extracted Data - Donor ID: $donor_id, MRO ID: $mro_id, Full Name: $full_name");

    error_log("Starting database transaction");
    // Start transaction
    $pdo->beginTransaction();

    try {
        // Check if donor request exists
        error_log("Checking if donor request exists for donor_id: $donor_id");
        $checkStmt = $pdo->prepare("SELECT dr.*, u.name, u.email FROM donor_requests dr JOIN users u ON dr.user_id = u.user_id WHERE dr.donor_id = ?");
        $checkStmt->execute([$donor_id]);
        $donorRequest = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$donorRequest) {
            error_log("Donor request not found for donor_id: $donor_id");
            throw new Exception("Donor request not found for ID: $donor_id. Please ensure the donor has submitted a registration request.");
        }

        error_log("Donor request found: " . json_encode($donorRequest));

        // Get user details
        $user_id = $donorRequest['user_id'];
        $dob = $donorRequest['dob'];
        $address = $donorRequest['address'];
        $city = $donorRequest['city'];
        $preferred_hospital_id = $donorRequest['preferred_hospital_id'];

        error_log("Processing donor record creation/update");

        // Check if donor already exists in donors table
        $stmt3 = $pdo->prepare("SELECT * FROM donors WHERE donor_id = ?");
        $stmt3->execute([$donor_id]);
        $existingDonor = $stmt3->fetch(PDO::FETCH_ASSOC);

        if ($existingDonor) {
            error_log("Updating existing donor record");
            // Update existing donor
            $sql4 = "UPDATE donors SET blood_type = ? WHERE donor_id = ?";
            $stmt4 = $pdo->prepare($sql4);
            $stmt4->execute([$blood_group, $donor_id]);
        } else {
            error_log("Creating new donor record");
            // Create new donor record in donors table
            $sql4 = "INSERT INTO donors (donor_id, user_id, dob, address, city, preferred_hospital_id, blood_type, status, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?)";
            $stmt4 = $pdo->prepare($sql4);
            $stmt4->execute([$donor_id, $user_id, $dob, $address, $city, $preferred_hospital_id, $blood_group, date('Y-m-d')]);
        }

        error_log("Creating medical verification record");
        // Insert into medical_verifications table
        $verification_id = 'MV' . substr(uniqid(), -8);
        $sql = "INSERT INTO medical_verifications (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$verification_id, $donor_id, $mro_id, $height_cm, $weight_kg, $medical_history, $doctor_notes, $verification_date, $age]);

        error_log("Creating notification");
        // Insert notification for donor verification
        $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
        $notifStmt->execute([$user_id, "Donor verified: $donor_id", 'success', 'unread']);

        error_log("Starting PDF generation");
        // Generate donor card PDF
        try {
            // Configure DomPDF options
            $options = new \Dompdf\Options();
            $options->set('defaultFont', 'Arial');
            $options->set('isRemoteEnabled', false);
            $options->set('isPhpEnabled', false);
            
            $dompdf = new \Dompdf\Dompdf($options);
            
            $html = '<!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .donor-card-container { border: 3px solid #dc3545; border-radius: 16px; max-width: 700px; margin: 30px auto; padding: 32px 24px 24px 24px; background: #fff; }
                .donor-card-title { text-align: center; color: #dc3545; font-size: 2.2rem; font-weight: bold; margin-bottom: 0.5rem; }
                .donor-card-subtitle { text-align: center; font-size: 1.1rem; color: #444; margin-bottom: 1.2rem; }
                .donor-card-divider { border: none; border-top: 3px dashed #dc3545; margin: 18px 0 28px 0; }
                .donor-card-table { width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 32px; }
                .donor-card-table td { padding: 8px 12px; font-size: 1.13rem; }
                .donor-card-table .label { font-weight: bold; color: #222; width: 160px; text-align: right; }
                .donor-card-table .value { background: #fde8ea; color: #b91c1c; font-weight: bold; border-radius: 4px; min-width: 220px; text-align: left; }
                .donor-card-thankyou { text-align: center; margin-top: 18px; font-size: 1.13rem; color: #222; }
                .donor-card-thankyou strong { color: #dc3545; font-weight: bold; }
                .donor-card-footer { text-align: center; color: #888; font-size: 0.98rem; margin-top: 32px; }
            </style>
        </head>
        <body>
            <div class="donor-card-container">
                <div class="donor-card-title">LIVEON</div>
                <div class="donor-card-subtitle">Blood Donor Card</div>
                <hr class="donor-card-divider">
                <table class="donor-card-table">
                    <tr><td class="label">Donor ID:</td><td class="value">' . $donor_id . '</td></tr>
                    <tr><td class="label">Full Name:</td><td class="value">' . htmlspecialchars($full_name) . '</td></tr>
                    <tr><td class="label">Blood Type:</td><td class="value">' . $blood_group . '</td></tr>
                    <tr><td class="label">Verification Date:</td><td class="value">' . $verification_date . '</td></tr>
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

            error_log("Loading HTML into Dompdf");
            $dompdf->loadHtml($html);
            
            error_log("Setting paper size");
            $dompdf->setPaper('A4', 'portrait');
            
            error_log("Rendering PDF");
            $dompdf->render();

            // Create uploads directory if it doesn't exist
            $uploadDir = dirname(__DIR__) . '/uploads/donor_cards/';
            if (!is_dir($uploadDir)) {
                error_log("Creating upload directory: $uploadDir");
                if (!mkdir($uploadDir, 0755, true)) {
                    throw new Exception("Failed to create upload directory: $uploadDir");
                }
            }

            // Check if directory is writable
            if (!is_writable($uploadDir)) {
                error_log("Upload directory is not writable: $uploadDir");
                // Try to fix permissions
                if (!chmod($uploadDir, 0755)) {
                    throw new Exception("Upload directory is not writable and permissions could not be fixed: $uploadDir");
                }
            }

            // Generate filename with timestamp
            $filename = 'donor_card_' . $donor_id . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $filepath = $uploadDir . $filename;

            error_log("Saving PDF to: $filepath");
            // Save PDF to file
            $pdfOutput = $dompdf->output();
            
            if (empty($pdfOutput)) {
                throw new Exception("PDF output is empty");
            }
            
            $pdfBytes = file_put_contents($filepath, $pdfOutput);

            if ($pdfBytes === false || $pdfBytes === 0) {
                throw new Exception("Failed to save PDF file - file_put_contents returned: " . var_export($pdfBytes, true));
            }

            error_log("PDF saved successfully, file size: $pdfBytes bytes");

            // Verify the file was actually created and is readable
            if (!file_exists($filepath)) {
                throw new Exception("PDF file was not created at expected location: $filepath");
            }

            if (filesize($filepath) === 0) {
                throw new Exception("PDF file was created but is empty: $filepath");
            }

            // Update donors table with donor_card PDF path - ONLY after PDF is successfully created
            $sqlUpdateCard = "UPDATE donors SET donor_card = ? WHERE donor_id = ?";
            $stmtUpdateCard = $pdo->prepare($sqlUpdateCard);
            $stmtUpdateCard->execute([$filepath, $donor_id]);
            error_log("Updated donor record with PDF path");

            // Only update donor_requests to 'approved' AFTER PDF is successfully created
            error_log("Updating donor request status to approved");
            $sql5 = "UPDATE donor_requests SET status = 'approved' WHERE donor_id = ?";
            $stmt5 = $pdo->prepare($sql5);
            $stmt5->execute([$donor_id]);

            // Update user status to 'active' after successful medical verification and PDF creation
            error_log("Updating user status to active");
            $sqlUserUpdate = "UPDATE users SET status = 'active' WHERE user_id = (SELECT user_id FROM donor_requests WHERE donor_id = ?)";
            $stmtUserUpdate = $pdo->prepare($sqlUserUpdate);
            $stmtUserUpdate->execute([$donor_id]);
            error_log("User status updated to active");

            // Commit transaction only if everything succeeded
            $pdo->commit();
            error_log("Transaction committed successfully");

            // Return success response
            echo json_encode([
                "success" => true,
                "message" => "Medical verification and PDF creation completed successfully",
                "data" => [
                    "pdf_path" => 'uploads/donor_cards/' . $filename,
                    "pdf_size_bytes" => $pdfBytes,
                    "donor_id" => $donor_id,
                    "verification_id" => $verification_id,
                    "full_path" => $filepath
                ]
            ]);

        } catch (Exception $pdfError) {
            error_log("PDF generation failed: " . $pdfError->getMessage());
            error_log("PDF Error trace: " . $pdfError->getTraceAsString());
            
            // More specific error message based on the error type
            $errorMessage = "PDF generation failed";
            if (strpos($pdfError->getMessage(), 'permission') !== false || strpos($pdfError->getMessage(), 'writable') !== false) {
                $errorMessage = "PDF generation failed: Upload directory permission error";
            } elseif (strpos($pdfError->getMessage(), 'directory') !== false) {
                $errorMessage = "PDF generation failed: Upload directory does not exist";
            } elseif (strpos($pdfError->getMessage(), 'DomPDF') !== false) {
                $errorMessage = "PDF generation failed: DomPDF library error";
            }
            
            throw new Exception($errorMessage . ": " . $pdfError->getMessage());
        }
        
    } catch (Exception $e) {
        // Rollback transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
            error_log("Transaction rolled back due to error: " . $e->getMessage());
        }
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    error_log("Database error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Server error: " . $e->getMessage());
    error_log("Server error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage()
    ]);
}

error_log("=== Medical Verification Debug End ===");
?>
