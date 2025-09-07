<?php
/**
 * Cron job script for sending donor reminders
 * 
 * This script should be scheduled to run daily or at desired intervals
 * Add to crontab: 0 9 * * * /usr/bin/php /path/to/this/script.php
 * (This example runs daily at 9:00 AM)
 */

// Set the script to run only in CLI mode for security
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die('This script can only be run from command line');
}

// Set proper error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Set the working directory to the script's directory
chdir(__DIR__);

require_once '../config/db_connection.php';
require_once '../services/DonorReminderService.php';

use LiveOn\Services\DonorReminderService;

function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;
    
    // Log to file
    file_put_contents(__DIR__ . '/../logs/donor_reminders.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    // Also output to console if running in CLI
    if (php_sapi_name() === 'cli') {
        echo $logMessage;
    }
}

try {
    logMessage("Starting donor reminder cron job");
    
    $reminderService = new DonorReminderService();
    
    // Check if reminders are enabled
    $settings = $reminderService->getReminderSettings();
    if (!isset($settings['reminder_enabled']) || $settings['reminder_enabled'] != '1') {
        logMessage("Donor reminders are disabled in settings. Exiting.");
        exit(0);
    }
    
    // Get the configured time to send reminders
    $reminderTime = $settings['reminder_time'] ?? '09:00:00';
    $currentTime = date('H:i:s');
    
    // Check if it's the right time to send reminders (allow 1-hour window)
    $reminderTimeStamp = strtotime($reminderTime);
    $currentTimeStamp = strtotime($currentTime);
    $timeDiff = abs($currentTimeStamp - $reminderTimeStamp);
    
    // Only run if within 1 hour of scheduled time (3600 seconds)
    if ($timeDiff > 3600) {
        logMessage("Not the scheduled time for reminders. Current: $currentTime, Scheduled: $reminderTime. Exiting.");
        exit(0);
    }
    
    logMessage("Processing donor reminders...");
    
    // Process all reminders
    $results = $reminderService->processAllReminders();
    
    // Log results
    logMessage("Reminder processing completed:");
    logMessage("- Total processed: " . $results['total_processed']);
    logMessage("- Successful: " . $results['successful']);
    logMessage("- Failed: " . $results['failed']);
    
    if (!empty($results['errors'])) {
        logMessage("Errors encountered:");
        foreach ($results['errors'] as $error) {
            logMessage("- $error");
        }
    }
    
    // If there were reminders sent, also log to admin_logs table for tracking
    if ($results['successful'] > 0 || $results['failed'] > 0) {
        try {
            $database = new Database();
            $pdo = $database->connect();
            
            $stmt = $pdo->prepare("
                INSERT INTO admin_logs (admin_id, action, target_table, target_id) 
                VALUES (NULL, ?, 'donor_reminders', NULL)
            ");
            
            $action = "Automatic reminder cron job: {$results['total_processed']} processed, {$results['successful']} sent, {$results['failed']} failed";
            $stmt->execute([$action]);
            
            logMessage("Logged activity to admin_logs table");
        } catch (Exception $e) {
            logMessage("Failed to log to admin_logs: " . $e->getMessage());
        }
    }
    
    logMessage("Donor reminder cron job completed successfully");
    
} catch (Exception $e) {
    $errorMessage = "Donor reminder cron job failed: " . $e->getMessage();
    logMessage($errorMessage);
    
    // Log error to PHP error log as well
    error_log($errorMessage);
    
    exit(1); // Exit with error code
}

exit(0); // Exit successfully
?>
