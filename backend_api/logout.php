<?php
session_start();

// Allow requests from both development ports
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

class LogoutHandler
{
    public function handle()
    {
        session_unset();
        session_destroy();
        echo json_encode(['success' => true]);
    }
}

$handler = new LogoutHandler();
$handler->handle();
