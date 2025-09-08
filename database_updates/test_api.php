<?php

/**
 * Test the donor reminder API
 */

// Set the base URL for the API
$baseUrl = 'http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php';

// Test 1: Get settings
echo "Testing API endpoint: GET settings\n";
echo "URL: {$baseUrl}?action=getSettings\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '?action=getSettings');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n\n";

if ($httpCode == 200) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "✅ API is working! Settings retrieved successfully.\n";
        echo "Settings found:\n";
        foreach ($data['data'] as $setting) {
            echo "  - {$setting['setting_name']}: {$setting['setting_value']}\n";
        }
    } else {
        echo "❌ API returned error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ HTTP request failed with code: {$httpCode}\n";
    echo "Error: " . curl_error($ch) . "\n";
}

curl_close($ch);

// Test 2: Get stats
echo "\nTesting API endpoint: GET stats\n";
echo "URL: {$baseUrl}?action=getStats\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '?action=getStats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n\n";

if ($httpCode == 200) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "✅ Stats API is working!\n";
        echo "Stats:\n";
        foreach ($data['data'] as $key => $value) {
            echo "  - {$key}: {$value}\n";
        }
    } else {
        echo "❌ Stats API returned error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Stats HTTP request failed with code: {$httpCode}\n";
}

curl_close($ch);
