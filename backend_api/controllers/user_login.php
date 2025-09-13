<?php
// Prevent any HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// PDOException is already available globally, no need to import

// Start output buffering to catch any HTML output
ob_start();

require_once __DIR__ . '/../config/session_config.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session manually
initSession();

require_once __DIR__ . '/../classes/Core/Database.php';
require_once __DIR__ . '/../classes/Models/User.php';

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit();
}

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Username and password are required"]);
    exit();
}

try {
    $db = \LiveOn\classes\Core\Database::getInstance();
    $conn = $db->connect();
    $userObj = new User($conn);
    $user = $userObj->login($username, $password);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection error",
        "debug" => $e->getMessage()
    ]);
    exit();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Login error",
        "debug" => $e->getMessage()
    ]);
    exit();
}

// Check for blocked user first
if ($user && isset($user['blocked']) && $user['blocked'] === true) {
    echo json_encode(["success" => false, "message" => $user['message']]);
    exit();
}

// Check for pending user
if ($user && isset($user['pending']) && $user['pending'] === true) {
    $message = $user['message'] ?? "Your registration is pending approval.";
    echo json_encode(["success" => false, "message" => $message]);
    exit();
}

// Check for successful login
if ($user && isset($user['user_id'])) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['user'] = $user;

    // Ensure session cookie is set for cross-origin requests with proper parameters
    if (session_status() === PHP_SESSION_ACTIVE) {
        $cookieSet = setcookie(session_name(), session_id(), [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        // If setcookie fails, try alternative approach
        if (!$cookieSet) {
            header('Set-Cookie: ' . session_name() . '=' . session_id() . '; Path=/; HttpOnly; SameSite=Lax');
        }
    }

    // Check for any captured output (HTML errors)
    $captured_output = ob_get_contents();
    ob_end_clean();

    if (!empty($captured_output)) {
        echo json_encode([
            "success" => false,
            "message" => "Server error occurred",
            "debug" => "HTML output detected: " . substr($captured_output, 0, 200)
        ]);
        exit();
    }

    echo json_encode(["success" => true, "user" => $user]);
} else {
    // Check for any captured output (HTML errors)
    $captured_output = ob_get_contents();
    ob_end_clean();

    if (!empty($captured_output)) {
        echo json_encode([
            "success" => false,
            "message" => "Server error occurred",
            "debug" => "HTML output detected: " . substr($captured_output, 0, 200)
        ]);
        exit();
    }

    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
}
