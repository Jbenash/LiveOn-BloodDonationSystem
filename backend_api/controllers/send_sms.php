<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight (OPTIONS) requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Replace with your actual text.lk API credentials
$api_token = '1112|t7WOaGcSTUjADQn7xz9EzKd8flS5qiIGXPNSHA7d251317e8'; // e.g., '1099|vv5YwddhufxS0W5uHzpeYZgD2OGNAIYLXdyjQEXo2796d85a'
$sender_id = 'TextLKDemo'; // e.g., 'YourName'

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$phone = isset($data['phone']) ? $data['phone'] : '';
$message = isset($data['message']) ? $data['message'] : '';

if (!$phone || !$message) {
    echo json_encode(['status' => 'error', 'message' => 'Phone and message are required.']);
    exit;
}

// Prepare payload for text.lk v3 API
$payload = [
    'recipient' => $phone,
    'sender_id' => $sender_id,
    'type' => 'plain',
    'message' => $message,
];

$ch = curl_init('https://app.text.lk/api/v3/sms/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $api_token,
    'Content-Type: application/json',
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode(['status' => 'error', 'message' => $error]);
    exit;
}

// Return the response from text.lk directly
http_response_code(200);
echo $response; 
