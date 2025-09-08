<?php

/**
 * Database update script for donor reminder system
 * Run this script to add the necessary tables and data for the reminder functionality
 */

require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    echo "Starting database update for donor reminder system...\n";

    $database = new Database();
    $pdo = $database->connect();

    // Read the SQL file
    $sqlFile = __DIR__ . '/donor_reminder_system.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }

    $sql = file_get_contents($sqlFile);
    if (!$sql) {
        throw new Exception("Could not read SQL file");
    }

    // Split the SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function ($stmt) {
            return !empty($stmt) && !preg_match('/^\s*--/', $stmt);
        }
    );

    $pdo->beginTransaction();

    foreach ($statements as $statement) {
        if (trim($statement)) {
            echo "Executing: " . substr($statement, 0, 50) . "...\n";
            $pdo->exec($statement);
        }
    }

    $pdo->commit();

    echo "Database update completed successfully!\n";
    echo "The following tables have been created/updated:\n";
    echo "- donor_reminders\n";
    echo "- reminder_settings\n";
    echo "\nDefault settings have been inserted.\n";
    echo "\nYou can now use the donor reminder functionality.\n";
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error updating database: " . $e->getMessage() . "\n";
    exit(1);
}
