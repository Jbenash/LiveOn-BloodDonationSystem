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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['donor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing donor_id']);
    exit();
}

$donor_id = $data['donor_id'];
$status = $data['status'] ?? 'available';
$delay = isset($data['delay_seconds']) ? (int)$data['delay_seconds'] : 0;

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liveon_db";

if ($delay > 0) {
    // Detach the process for delayed update
    $phpPath = PHP_BINARY;
    $script = __FILE__;
    $donorIdShell = escapeshellarg($donor_id);
    $statusShell = escapeshellarg($status);
    if (strtoupper(PHP_OS_FAMILY) === 'WINDOWS') {
        $fullCmd = 'start /B cmd /C "ping 127.0.0.1 -n ' . ($delay + 1) . ' > nul && ' . $phpPath . ' ' . $script . ' ' . $donorIdShell . ' ' . $statusShell . ' > nul 2>&1"';
        pclose(popen($fullCmd, 'r'));
    } else {
        $cmd = "$phpPath $script $donorIdShell $statusShell > /dev/null 2>&1 &";
        $fullCmd = "(sleep $delay; $cmd) > /dev/null 2>&1 &";
        exec($fullCmd);
    }
    echo json_encode(['success' => true, 'message' => 'Status update scheduled']);
    exit();
}

// If called directly (no delay or via CLI for delayed update)
if (php_sapi_name() === 'cli' && isset($argv) && count($argv) >= 2) {
    $donor_id = $argv[1];
    $status = $argv[2] ?? 'available';
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection error: ' . $conn->connect_error]);
    exit();
}

$sql = "UPDATE donors SET status = ? WHERE donor_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $status, $donor_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Donor status updated']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update donor status']);
}
$stmt->close();
$conn->close();