<?php
// Set CORS headers dynamically
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once __DIR__ . '/../classes/Database.php';

    $database = Database::getInstance();
    $pdo = $database->connect();

    // Create test admin user
    $adminEmail = 'admin@test.com';
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminName = 'Test Administrator';
    $adminPhone = '0770000000';

    // Generate user_id
    $adminId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Test admin user already exists',
            'login_credentials' => [
                'email' => $adminEmail,
                'password' => 'admin123'
            ]
        ]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')");
    $stmt->execute([$adminId, $adminName, $adminEmail, $adminPhone, $adminPassword]);

    echo json_encode([
        'success' => true,
        'message' => 'Test admin user created successfully',
        'admin_user' => [
            'user_id' => $adminId,
            'name' => $adminName,
            'email' => $adminEmail,
            'role' => 'admin',
            'status' => 'active'
        ],
        'login_credentials' => [
            'email' => $adminEmail,
            'password' => 'admin123'
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
