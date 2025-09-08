<?php
require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->query("SELECT email, name FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        echo "Admin login credentials:\n";
        echo "Email: " . $admin['email'] . "\n";
        echo "Name: " . $admin['name'] . "\n";
        echo "Password: Check your system documentation\n";
    } else {
        echo "No admin user found\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
