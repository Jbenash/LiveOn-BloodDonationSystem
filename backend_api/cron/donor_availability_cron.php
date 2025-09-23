<?php

/**
 * Donor Availability Cron Job
 * 
 * This script automatically updates donor availability status based on their next_eligible_date.
 * Donors who have passed their 6-month waiting period after donation will be marked as 'available'.
 * 
 * This script should be run daily via cron job or task scheduler.
 * 
 * Usage: php donor_availability_cron.php
 * Cron Schedule: 0 6 * * * (Daily at 6:00 AM)
 */

// Prevent direct web access
if (php_sapi_name() !== 'cli' && php_sapi_name() !== 'cli-server') {
    header('HTTP/1.1 403 Forbidden');
    echo "Direct access not allowed. This script must be run from command line.";
    exit(1);
}

// Set error reporting for cron job
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Set timezone
date_default_timezone_set('Asia/Colombo');

// Include required files
require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../services/DonorService.php';

try {
    // Log cron job start
    $logMessage = "[" . date('Y-m-d H:i:s') . "] Donor Availability Cron Job Started\n";
    error_log($logMessage, 3, __DIR__ . '/../logs/donor_availability_cron.log');

    // Initialize database connection
    $database = new Database();
    $pdo = $database->connect();

    if (!$pdo) {
        throw new Exception("Failed to connect to database");
    }

    // Initialize DonorService
    $donorService = new DonorService($pdo);

    // Run the donor availability update
    $result = $donorService->updateDonorAvailability();

    if ($result['success']) {
        $eligibleCount = isset($result['eligible_donors']) ? $result['eligible_donors'] : 0;
        $successMessage = "[" . date('Y-m-d H:i:s') . "] " . $result['message'] .
            " (Updated: {$result['updated_count']}/{$eligibleCount})\n";
        error_log($successMessage, 3, __DIR__ . '/../logs/donor_availability_cron.log');

        // Output for command line
        echo "SUCCESS: " . $result['message'] . "\n";
        echo "Updated donors: {$result['updated_count']}\n";
        echo "Eligible donors checked: {$eligibleCount}\n";
    } else {
        $errorMessage = "[" . date('Y-m-d H:i:s') . "] ERROR: " . $result['error'] . "\n";
        error_log($errorMessage, 3, __DIR__ . '/../logs/donor_availability_cron.log');

        // Output for command line
        echo "ERROR: " . $result['error'] . "\n";
        exit(1);
    }
} catch (Exception $e) {
    $criticalError = "[" . date('Y-m-d H:i:s') . "] CRITICAL ERROR: " . $e->getMessage() . "\n";
    error_log($criticalError, 3, __DIR__ . '/../logs/donor_availability_cron.log');

    // Output for command line
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
} catch (Throwable $t) {
    $fatalError = "[" . date('Y-m-d H:i:s') . "] FATAL ERROR: " . $t->getMessage() . "\n";
    error_log($fatalError, 3, __DIR__ . '/../logs/donor_availability_cron.log');

    // Output for command line
    echo "FATAL ERROR: " . $t->getMessage() . "\n";
    exit(1);
}

// Log successful completion
$completionMessage = "[" . date('Y-m-d H:i:s') . "] Donor Availability Cron Job Completed Successfully\n";
error_log($completionMessage, 3, __DIR__ . '/../logs/donor_availability_cron.log');

echo "Donor availability cron job completed successfully.\n";
exit(0);
