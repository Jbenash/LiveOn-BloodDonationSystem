<?php
/**
 * Test SMS sending with authorized sender ID
 */

require_once __DIR__ . '/../backend_api/services/DonorReminderService.php';

echo "=== Testing SMS with Authorized Sender ID ===\n\n";

try {
    $reminderService = new LiveOn\Services\DonorReminderService();
    
    // Test data - you can change this phone number to your own for testing
    $testDonor = [
        'donor_id' => 'TEST001',
        'user_id' => 'US006',
        'name' => 'Test User',
        'phone' => '0760312229', // The number from the database
        'email' => 'test@example.com'
    ];
    
    echo "Testing SMS to: {$testDonor['phone']}\n";
    echo "Using updated sender ID...\n\n";
    
    // Send test reminder
    $result = $reminderService->sendSMSReminder($testDonor);
    
    if ($result['success']) {
        echo "✅ SMS sent successfully!\n";
        echo "Response: " . json_encode($result['sms_response'], JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "❌ SMS failed to send\n";
        echo "Error: {$result['error']}\n";
        if (isset($result['sms_response'])) {
            echo "SMS API Response: " . json_encode($result['sms_response'], JSON_PRETTY_PRINT) . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test completed ===\n";
echo "Check your phone for the SMS message!\n";
?>
