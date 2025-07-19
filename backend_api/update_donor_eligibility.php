<?php
require_once __DIR__ . '/db_connection.php';

// Create Database object and get PDO connection
$db = new Database();
$pdo = $db->connect();

try {
    $sql = "
        UPDATE donors
        SET status = 'available'
        WHERE status = 'not available'
        AND (
            (last_donation_date IS NOT NULL AND last_donation_date <= DATE_SUB(NOW(), INTERVAL 1 MINUTE ))
            OR
            (last_donation_date IS NULL AND registration_date <= DATE_SUB(NOW(), INTERVAL 1 MINUTE))
        )
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    echo "Donor eligibility updated successfully at " . date('Y-m-d H:i:s') . "\n";
} catch (PDOException $e) {
    echo "Error updating donor eligibility: " . $e->getMessage();
}