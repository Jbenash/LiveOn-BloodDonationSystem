<?php
if (php_sapi_name() !== 'cli') {
    exit("This script must be run from the command line.\n");
}
if (!isset($argc) || $argc < 2) {
    exit("No donor ID provided.\n");
}

$donor_id = $argv[1];

$conn = new mysqli('localhost', 'root', '', 'liveon_db');
if ($conn->connect_error) {
    exit("Connection failed: " . $conn->connect_error);
}

$conn->query("UPDATE donors SET status = 'available' WHERE donor_id = '$donor_id'");

// Optional logging
file_put_contents(__DIR__ . "/status_log.txt", date('Y-m-d H:i:s') . " - Donor $donor_id marked as available\n", FILE_APPEND);

$conn->close();
?> 