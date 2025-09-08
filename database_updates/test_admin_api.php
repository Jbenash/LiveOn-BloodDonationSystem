<?php

/**
 * Direct test of donor reminders API with session simulation
 */

require_once __DIR__ . '/../backend_api/config/session_config.php';
require_once __DIR__ . '/../backend_api/config/db_connection.php';

// Start session and simulate admin login
session_start();

echo "Testing Donor Reminders API with admin session...\n\n";

// First, let's check if we have admin users
try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->query("SELECT user_id, email, name FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        echo "❌ No admin user found in database!\n";
        exit(1);
    }

    echo "Found admin user:\n";
    echo "  - ID: {$admin['user_id']}\n";
    echo "  - Email: {$admin['email']}\n";
    echo "  - Name: {$admin['name']}\n\n";

    // Simulate admin session
    $_SESSION['user_id'] = $admin['user_id'];
    $_SESSION['role'] = 'admin';
    $_SESSION['email'] = $admin['email'];
    $_SESSION['name'] = $admin['name'];

    echo "✅ Admin session created\n";
    echo "Session data:\n";
    echo "  - user_id: " . ($_SESSION['user_id'] ?? 'not set') . "\n";
    echo "  - role: " . ($_SESSION['role'] ?? 'not set') . "\n\n";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
}

// Now test the API internally
echo "Testing API endpoints...\n\n";

// Test 1: Settings
echo "1. Testing settings...\n";
try {
    // Include the donor reminders service
    require_once __DIR__ . '/../backend_api/services/DonorReminderService.php';

    $reminderService = new LiveOn\Services\DonorReminderService();
    $settings = $reminderService->getReminderSettings();

    echo "✅ Settings loaded successfully\n";
    echo "Settings:\n";
    foreach ($settings as $key => $value) {
        echo "  - {$key}: {$value}\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Settings error: " . $e->getMessage() . "\n\n";
}

// Test 2: Stats
echo "2. Testing stats...\n";
try {
    $stats = $reminderService->getReminderStats(30);

    echo "✅ Stats loaded successfully\n";
    echo "Stats:\n";
    foreach ($stats as $key => $value) {
        echo "  - {$key}: {$value}\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Stats error: " . $e->getMessage() . "\n\n";
}

// Test 3: Donors needing reminders
echo "3. Testing donors needing reminders...\n";
try {
    $donors = $reminderService->getDonorsNeedingReminders();

    echo "✅ Donors list loaded successfully\n";
    echo "Found " . count($donors) . " donors needing reminders\n";

    if (count($donors) > 0) {
        echo "Sample donor:\n";
        $firstDonor = $donors[0];
        foreach ($firstDonor as $key => $value) {
            echo "  - {$key}: {$value}\n";
        }
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Donors error: " . $e->getMessage() . "\n\n";
}

echo "API test completed!\n";
