<?php

session_start();

// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

header("Content-Type: application/json");
require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../classes/User.php';

class LoginManager
{
    private $userObj;
    public function __construct($conn)
    {
        $this->userObj = new User($conn);
    }
    public function login($username, $password)
    {
        return $this->userObj->login($username, $password);
    }
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// Now use $username and $password for authentication

$db = new Database();
$conn = $db->connect();
$loginManager = new LoginManager($conn);

$user = $loginManager->login($username, $password);

// Check for blocked user first
if ($user && isset($user['blocked']) && $user['blocked'] === true) {
    echo json_encode(["success" => false, "message" => $user['message']]);
    exit();
}

// Check for pending user
if ($user && isset($user['pending']) && $user['pending'] === true) {
    echo json_encode(["success" => false, "message" => "Your registration is pending approval."]);
    exit();
}

// Check for successful login
if ($user && isset($user['user_id'])) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['user'] = $user;
    echo json_encode(["success" => true, "user" => $user]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
}
