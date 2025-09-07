<?php
require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    
    // Create a new admin user with known credentials
    $adminEmail = 'test@admin.com';
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminName = 'Test Admin';
    $adminPhone = '0771234567';
    $adminId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

    // Check if this email already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    
    if ($stmt->fetchColumn() > 0) {
        echo "Admin user with email 'test@admin.com' already exists.\n";
        echo "Use these credentials:\n";
        echo "Email: test@admin.com\n";
        echo "Password: admin123\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')");
        $stmt->execute([$adminId, $adminName, $adminEmail, $adminPhone, $adminPassword]);

        echo "✅ New admin user created successfully!\n\n";
        echo "LOGIN CREDENTIALS:\n";
        echo "Email: test@admin.com\n";
        echo "Password: admin123\n\n";
        echo "Use these credentials to log in at: http://localhost:5174/\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
