<?php
// Test API endpoints for donor reminders
session_start();

// Simulate admin session for testing
$_SESSION['user_id'] = 'US004';
$_SESSION['role'] = 'admin';

echo "Testing Donor Reminders API endpoints...\n\n";

// Test the settings endpoint
echo "1. Testing Settings Endpoint:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=getSettings');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, sys_get_temp_dir() . '/cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, sys_get_temp_dir() . '/cookies.txt');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Test the stats endpoint
echo "2. Testing Stats Endpoint:\n";
curl_setopt($ch, CURLOPT_URL, 'http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=getStats');
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Test the donors needing reminders endpoint
echo "3. Testing Donors Needing Reminders Endpoint:\n";
curl_setopt($ch, CURLOPT_URL, 'http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=getDonorsNeedingReminders');
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

curl_close($ch);

echo "Test completed.\n";
