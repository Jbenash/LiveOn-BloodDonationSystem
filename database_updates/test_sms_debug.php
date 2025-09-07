<?php
/**
 * Test SMS sending functionality
 */

require_once __DIR__ . '/../backend_api/services/DonorReminderService.php';
require_once __DIR__ . '/../backend_api/config/db_connection.php';

echo "=== SMS Delivery Debug Test ===\n\n";

try {
    $reminderService = new LiveOn\Services\DonorReminderService();
    
    // Test 1: Check settings
    echo "1. Checking reminder settings...\n";
    $settings = $reminderService->getReminderSettings();
    foreach ($settings as $key => $value) {
        echo "   - $key: $value\n";
    }
    echo "\n";
    
    // Test 2: Check logs directory
    echo "2. Checking logs...\n";
    $logFile = __DIR__ . '/../backend_api/logs/donor_reminders.log';
    if (file_exists($logFile)) {
        echo "   ✅ Log file exists: $logFile\n";
        $logContent = file_get_contents($logFile);
        $lines = explode("\n", $logContent);
        $recentLines = array_slice($lines, -10); // Last 10 lines
        echo "   Recent log entries:\n";
        foreach ($recentLines as $line) {
            if (trim($line)) {
                echo "   $line\n";
            }
        }
    } else {
        echo "   ❌ Log file not found: $logFile\n";
    }
    echo "\n";
    
    // Test 3: Check database for recent reminders
    echo "3. Checking recent reminder records in database...\n";
    $database = new Database();
    $pdo = $database->connect();
    
    $stmt = $pdo->query("
        SELECT dr.*, u.name, u.phone, u.email 
        FROM donor_reminders dr 
        LEFT JOIN users u ON dr.user_id = u.user_id 
        ORDER BY dr.sent_date DESC 
        LIMIT 5
    ");
    $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($reminders) > 0) {
        echo "   ✅ Found " . count($reminders) . " recent reminder(s):\n";
        foreach ($reminders as $reminder) {
            echo "   - ID: {$reminder['reminder_id']}\n";
            echo "     Donor: {$reminder['name']} ({$reminder['phone']})\n";
            echo "     Status: {$reminder['status']}\n";
            echo "     Sent: {$reminder['sent_date']}\n";
            echo "     SMS Response: " . substr($reminder['sms_response'], 0, 100) . "...\n";
            echo "\n";
        }
    } else {
        echo "   ❌ No reminder records found in database\n";
    }
    
    // Test 4: Test phone number format
    echo "4. Testing phone number formats...\n";
    $testNumbers = [
        '0771234567',  // Sri Lankan format
        '+94771234567', // International format
        '94771234567'   // Country code without +
    ];
    
    foreach ($testNumbers as $testNumber) {
        echo "   Testing format: $testNumber\n";
        
        // Check if this format would work with text.lk
        if (preg_match('/^(\+94|94|0)[0-9]{9}$/', $testNumber)) {
            echo "   ✅ Valid Sri Lankan number format\n";
        } else {
            echo "   ❌ Invalid number format\n";
        }
    }
    echo "\n";
    
    // Test 5: Check API connectivity (without sending actual SMS)
    echo "5. Testing text.lk API connectivity...\n";
    $ch = curl_init('https://app.text.lk/api/v3/sms/send');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request only
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "   ❌ Network error: $error\n";
    } else {
        echo "   ✅ API endpoint reachable (HTTP $httpCode)\n";
    }
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "=== Test completed ===\n";
?>
