<?php
require_once __DIR__ . '/../config/db_connection.php';

// Create Database object and get PDO connection
$db = new Database();
$pdo = $db->connect();

try {
    $sql = "
        UPDATE donors
        SET status = 'available', next_eligible_date = NULL
        WHERE status = 'not available'
        AND (
            (last_donation_date IS NOT NULL AND last_donation_date <= DATE_SUB(CURDATE(), INTERVAL 56 DAY))
            OR
            (last_donation_date IS NULL AND registration_date <= DATE_SUB(CURDATE(), INTERVAL 56 DAY))
        )
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $rowsAffected = $stmt->rowCount();

    echo "Donor eligibility updated successfully at " . date('Y-m-d H:i:s') . " - $rowsAffected donors updated\n";
} catch (PDOException $e) {
    echo "Error updating donor eligibility: " . $e->getMessage();
}
