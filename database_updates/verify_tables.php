<?php
require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();
    
    echo "Checking tables...\n";
    
    // Check if tables exist
    $result = $pdo->query("SHOW TABLES LIKE 'donor_reminders'");
    if ($result->rowCount() > 0) {
        echo "✅ donor_reminders table exists\n";
        
        // Get table structure
        $result = $pdo->query("DESCRIBE donor_reminders");
        echo "Table structure:\n";
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$row['Field']} ({$row['Type']})\n";
        }
    } else {
        echo "❌ donor_reminders table does not exist\n";
    }
    
    $result = $pdo->query("SHOW TABLES LIKE 'reminder_settings'");
    if ($result->rowCount() > 0) {
        echo "\n✅ reminder_settings table exists\n";
        
        // Get table structure
        $result = $pdo->query("DESCRIBE reminder_settings");
        echo "Table structure:\n";
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$row['Field']} ({$row['Type']})\n";
        }
        
        // Check settings
        echo "\nSettings data:\n";
        $result = $pdo->query("SELECT * FROM reminder_settings");
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$row['setting_name']}: {$row['setting_value']}\n";
        }
    } else {
        echo "❌ reminder_settings table does not exist\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
