<?php
require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    
    echo "Checking for admin users in the database...\n\n";
    
    $stmt = $pdo->query("SELECT user_id, name, email, role, status FROM users WHERE role = 'admin'");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($admins) > 0) {
        echo "Found " . count($admins) . " admin user(s):\n";
        foreach ($admins as $admin) {
            echo "  - ID: {$admin['user_id']}\n";
            echo "    Name: {$admin['name']}\n";
            echo "    Email: {$admin['email']}\n";
            echo "    Status: {$admin['status']}\n\n";
        }
        echo "Use any of these email addresses to log in to the admin dashboard.\n";
    } else {
        echo "No admin users found. Creating one...\n\n";
        
        // Create admin user
        $adminEmail = 'admin@liveon.com';
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $adminName = 'System Administrator';
        $adminPhone = '0770000000';
        $adminId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

        $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')");
        $stmt->execute([$adminId, $adminName, $adminEmail, $adminPhone, $adminPassword]);

        echo "✅ Admin user created!\n";
        echo "Login Credentials:\n";
        echo "  - Email: {$adminEmail}\n";
        echo "  - Password: admin123\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
