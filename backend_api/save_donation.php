<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

// Validate required fields
$required_fields = ['donor_id', 'blood_type', 'donation_date', 'volume'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

// Database connection
$host = 'localhost';
$dbname = 'liveon_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Generate unique donation_id
    $donation_id = 'DON' . date('YmdHis') . rand(100, 999);
    
    // Prepare SQL statement
    $sql = "INSERT INTO donations (donation_id, donor_id, blood_type, donation_date, units_donated, hospital_id) 
            VALUES (:donation_id, :donor_id, :blood_type, :donation_date, :units_donated, :hospital_id)";
    
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters
    $stmt->bindParam(':donation_id', $donation_id);
    $stmt->bindParam(':donor_id', $input['donor_id']);
    $stmt->bindParam(':blood_type', $input['blood_type']);
    $stmt->bindParam(':donation_date', $input['donation_date']);
    $stmt->bindParam(':units_donated', $input['volume']);
    $hospital_id = 'HS002'; // Use the correct hospital_id from your hospitals table
    $stmt->bindParam(':hospital_id', $hospital_id);
    
    // Execute the statement
    $stmt->execute();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Donation saved successfully',
        'donation_id' => $donation_id
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 