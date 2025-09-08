<?php

/**
 * Create admin user via direct script execution
 */

require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    echo "Checking for existing admin users...\n";

    // Check if admin user already exists
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] > 0) {
        echo "✅ Admin user already exists (count: {$result['count']})\n";

        // Get admin user details
        $stmt = $pdo->query("SELECT user_id, name, email FROM users WHERE role = 'admin' LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        echo "Admin User Details:\n";
        echo "  - User ID: {$admin['user_id']}\n";
        echo "  - Name: {$admin['name']}\n";
        echo "  - Email: {$admin['email']}\n";
        echo "  - Login: Use this email with your password\n";
        exit;
    }

    echo "Creating new admin user...\n";

    // Create admin user
    $adminEmail = 'admin@liveon.com';
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminName = 'System Administrator';
    $adminPhone = '0770000000';

    // Generate user_id
    $adminId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

    $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')");
    $stmt->execute([$adminId, $adminName, $adminEmail, $adminPhone, $adminPassword]);

    echo "✅ Admin user created successfully!\n";
    echo "\nLogin Credentials:\n";
    echo "  - Email: {$adminEmail}\n";
    echo "  - Password: admin123\n";
    echo "  - User ID: {$adminId}\n";
    echo "  - Role: admin\n";
    echo "\nYou can now log in to the admin dashboard and access the donor reminders functionality.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
