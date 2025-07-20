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

// Debug logging function
function log_debug($msg) {
    file_put_contents(__DIR__ . '/donation_debug.log', date('Y-m-d H:i:s') . ' ' . $msg . "\n", FILE_APPEND);
}

// Log the raw input
log_debug('Raw input: ' . file_get_contents('php://input'));

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    log_debug('Invalid JSON input');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

// Validate required fields
$required_fields = ['donor_id', 'blood_type', 'donation_date', 'volume'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        log_debug("Missing required field: $field");
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
    try {
        $stmt->execute();
    } catch (PDOException $e) {
        log_debug('SQL Insert Error: ' . $e->getMessage());
        throw $e;
    }

    // Update donors table status to 'not available'
    $sql2 = "UPDATE donors SET status = 'not available' WHERE donor_id = :donor_id";
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->bindParam(':donor_id', $input['donor_id']);
    try {
        $stmt2->execute();
    } catch (PDOException $e) {
        log_debug('SQL Update Donor Status Error: ' . $e->getMessage());
        throw $e;
    }

    // Convert UTC donation_date to Asia/Colombo local time with milliseconds
    $date = new DateTime($input['donation_date'], new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('Asia/Colombo'));
    $localDatetime = $date->format('Y-m-d H:i:s.v');
    // Update donors table last_donation_date to the value provided by the frontend (with ms)
    $sql3 = "UPDATE donors SET last_donation_date = :donation_date WHERE donor_id = :donor_id";
    $stmt3 = $pdo->prepare($sql3);
    $stmt3->bindParam(':donation_date', $localDatetime);
    $stmt3->bindParam(':donor_id', $input['donor_id']);
    try {
        $stmt3->execute();
    } catch (PDOException $e) {
        log_debug('SQL Update Last Donation Date Error: ' . $e->getMessage());
        throw $e;
    }

    // Schedule a background PHP process to set status back to 'available' after 1 minute
    log_debug('Scheduling background status update for donor_id: ' . $input['donor_id']);
    $donorIdShell = escapeshellarg($input['donor_id']);
    $phpPath = PHP_BINARY;
    $script = __DIR__ . '/update_donor_status_available.php';
    
    if (strtoupper(PHP_OS_FAMILY) === 'WINDOWS') {
        // Windows: use ping for delay and start for background
        $fullCmd = 'start /B cmd /C "ping 127.0.0.1 -n 301 > nul && ' . $phpPath . ' ' . $script . ' ' . $donorIdShell . ' > nul 2>&1"';
        pclose(popen($fullCmd, 'r'));
    } else {
        $cmd = "$phpPath $script $donorIdShell > /dev/null 2>&1 &";
        $fullCmd = "(sleep 120; $cmd) > /dev/null 2>&1 &";
        exec($fullCmd);
    }

    // Return success response
    log_debug('Donation saved successfully for donor_id: ' . $input['donor_id'] . ', donation_id: ' . $donation_id);
    echo json_encode([
        'success' => true,
        'message' => 'Donation saved successfully',
        'donation_id' => $donation_id
    ]);
    
} catch (PDOException $e) {
    log_debug('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    log_debug('Server error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
