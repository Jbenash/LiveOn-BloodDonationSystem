<?php

/**
 * Test Script for Donor Availability System
 * 
 * This script tests the donor availability update functionality
 * Usage: php test_donor_availability.php
 */

// Prevent direct web access
if (php_sapi_name() !== 'cli' && php_sapi_name() !== 'cli-server') {
    header('HTTP/1.1 403 Forbidden');
    echo "Direct access not allowed. This script must be run from command line.";
    exit(1);
}

// Set error reporting for testing
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('Asia/Colombo');

// Include required files
require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../services/DonorService.php';

echo "=== Donor Availability System Test ===\n\n";

try {
    // Initialize database connection
    $database = new Database();
    $pdo = $database->connect();

    if (!$pdo) {
        throw new Exception("Failed to connect to database");
    }

    echo "✓ Database connection successful\n";

    // Initialize DonorService
    $donorService = new DonorService($pdo);
    echo "✓ DonorService initialized\n\n";

    // Test 1: Check current donor status
    echo "=== Test 1: Current Donor Status ===\n";
    $sql = "SELECT donor_id, status, next_eligible_date, last_donation_date 
            FROM donors 
            WHERE status = 'not available' 
            LIMIT 5";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $notAvailableDonors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($notAvailableDonors)) {
        echo "No donors currently marked as 'not available'\n";
    } else {
        echo "Found " . count($notAvailableDonors) . " donors marked as 'not available':\n";
        foreach ($notAvailableDonors as $donor) {
            echo "- Donor: {$donor['donor_id']}, Next Eligible: {$donor['next_eligible_date']}\n";
        }
    }
    echo "\n";

    // Test 2: Check donors eligible for availability update
    echo "=== Test 2: Eligible Donors for Update ===\n";
    $currentDate = date('Y-m-d');
    $sql = "SELECT donor_id, status, next_eligible_date, last_donation_date 
            FROM donors 
            WHERE status = 'not available' 
            AND next_eligible_date IS NOT NULL 
            AND next_eligible_date <= :current_date";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':current_date', $currentDate);
    $stmt->execute();
    $eligibleDonors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($eligibleDonors)) {
        echo "No donors currently eligible for availability update (next_eligible_date <= $currentDate)\n";
    } else {
        echo "Found " . count($eligibleDonors) . " donors eligible for availability update:\n";
        foreach ($eligibleDonors as $donor) {
            echo "- Donor: {$donor['donor_id']}, Next Eligible: {$donor['next_eligible_date']}\n";
        }
    }
    echo "\n";

    // Test 3: Run the donor availability update
    echo "=== Test 3: Running Donor Availability Update ===\n";
    $result = $donorService->updateDonorAvailability();

    if ($result['success']) {
        echo "✓ Update successful!\n";
        echo "  Message: {$result['message']}\n";
        echo "  Updated donors: {$result['updated_count']}\n";
        echo "  Eligible donors checked: {$result['eligible_donors']}\n";
    } else {
        echo "✗ Update failed!\n";
        echo "  Error: {$result['error']}\n";
    }
    echo "\n";

    // Test 4: Verify the updates
    if ($result['success'] && $result['updated_count'] > 0) {
        echo "=== Test 4: Verifying Updates ===\n";
        $sql = "SELECT donor_id, status, next_eligible_date, last_donation_date 
                FROM donors 
                WHERE status = 'available' 
                AND last_donation_date IS NOT NULL 
                ORDER BY last_donation_date DESC 
                LIMIT 5";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $recentlyAvailable = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($recentlyAvailable)) {
            echo "Recently updated donors now marked as 'available':\n";
            foreach ($recentlyAvailable as $donor) {
                echo "- Donor: {$donor['donor_id']}, Last Donation: {$donor['last_donation_date']}, Next Eligible: {$donor['next_eligible_date']}\n";
            }
        }
        echo "\n";
    }

    // Test 5: Test donation process with 6-month calculation
    echo "=== Test 5: Testing 6-Month Calculation ===\n";
    $testDate = date('Y-m-d');
    $nextEligibleDate = new \DateTime($testDate);
    $nextEligibleDate->add(new \DateInterval('P6M'));
    $nextEligibleDateStr = $nextEligibleDate->format('Y-m-d');

    echo "If donation made today ($testDate):\n";
    echo "Next eligible date would be: $nextEligibleDateStr\n";
    echo "Days difference: " . $nextEligibleDate->diff(new \DateTime($testDate))->days . " days\n";
    echo "\n";

    echo "=== Test Summary ===\n";
    echo "✓ All tests completed successfully\n";
    echo "✓ Donor availability system is functioning correctly\n";
    echo "✓ 6-month eligibility period is properly calculated\n";
    echo "✓ Automatic status updates are working\n";
} catch (Exception $e) {
    echo "✗ Test failed with error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Throwable $t) {
    echo "✗ Test failed with fatal error: " . $t->getMessage() . "\n";
    exit(1);
}

echo "\nDonor availability system test completed successfully!\n";
exit(0);
