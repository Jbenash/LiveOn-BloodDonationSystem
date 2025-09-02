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
    require_once __DIR__ . '/../classes/Core/Database.php';

    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    // Check if admin user already exists
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin user already exists',
            'admin_count' => $result['count']
        ]);
        exit;
    }

    // Create admin user
    $adminEmail = 'admin@liveon.com';
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminName = 'System Administrator';
    $adminPhone = '0770000000';

    // Generate user_id
    $adminId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

    $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')");
    $stmt->execute([$adminId, $adminName, $adminEmail, $adminPhone, $adminPassword]);

    echo json_encode([
        'success' => true,
        'message' => 'Admin user created successfully',
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
