<?php
/**
 * Simple database setup script for reminder system
 */

require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    echo "Connecting to database...\n";
    
    $database = new Database();
    $pdo = $database->connect();
    
    echo "Creating donor_reminders table...\n";
    
    // Create donor_reminders table
    $sql1 = "CREATE TABLE IF NOT EXISTS `donor_reminders` (
      `reminder_id` int(11) NOT NULL AUTO_INCREMENT,
      `donor_id` varchar(10) NOT NULL,
      `user_id` varchar(10) NOT NULL,
      `reminder_type` enum('6_month_general', 'donation_eligible', 'appointment') DEFAULT '6_month_general',
      `sent_date` timestamp NOT NULL DEFAULT current_timestamp(),
      `next_reminder_date` date NOT NULL,
      `message_content` text NOT NULL,
      `status` enum('sent', 'failed', 'pending') DEFAULT 'pending',
      `phone_number` varchar(20) NOT NULL,
      `sms_response` text DEFAULT NULL,
      PRIMARY KEY (`reminder_id`),
      KEY `fk_donor_reminders_donor` (`donor_id`),
      KEY `fk_donor_reminders_user` (`user_id`),
      KEY `idx_next_reminder_date` (`next_reminder_date`),
      KEY `idx_reminder_type_status` (`reminder_type`, `status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    $pdo->exec($sql1);
    echo "✅ donor_reminders table created\n";
    
    echo "Creating reminder_settings table...\n";
    
    // Create reminder_settings table
    $sql2 = "CREATE TABLE IF NOT EXISTS `reminder_settings` (
      `setting_id` int(11) NOT NULL AUTO_INCREMENT,
      `setting_name` varchar(100) NOT NULL UNIQUE,
      `setting_value` text NOT NULL,
      `description` text DEFAULT NULL,
      `updated_by` varchar(10) DEFAULT NULL,
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`setting_id`),
      KEY `fk_reminder_settings_user` (`updated_by`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    $pdo->exec($sql2);
    echo "✅ reminder_settings table created\n";
    
    echo "Adding foreign key constraints...\n";
    
    // Check if foreign key constraints exist before adding them
    try {
        $pdo->exec("ALTER TABLE `donor_reminders` ADD CONSTRAINT `fk_donor_reminders_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE");
        echo "✅ Added foreign key constraint for donor_id\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "⚠️  Foreign key constraint for donor_id already exists\n";
        } else {
            echo "⚠️  Could not add foreign key constraint for donor_id: " . $e->getMessage() . "\n";
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE `donor_reminders` ADD CONSTRAINT `fk_donor_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE");
        echo "✅ Added foreign key constraint for user_id\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "⚠️  Foreign key constraint for user_id already exists\n";
        } else {
            echo "⚠️  Could not add foreign key constraint for user_id: " . $e->getMessage() . "\n";
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE `reminder_settings` ADD CONSTRAINT `fk_reminder_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL");
        echo "✅ Added foreign key constraint for updated_by\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "⚠️  Foreign key constraint for updated_by already exists\n";
        } else {
            echo "⚠️  Could not add foreign key constraint for updated_by: " . $e->getMessage() . "\n";
        }
    }
    
    echo "Inserting default settings...\n";
    
    // Insert default settings
    $defaultSettings = [
        ['reminder_interval_months', '6', 'Number of months between reminders'],
        ['reminder_message_template', 'Hello {donor_name}! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero!', 'Template for 6-month reminder messages. Use {donor_name} for personalization'],
        ['reminder_enabled', '1', 'Enable or disable automatic reminders (1 = enabled, 0 = disabled)'],
        ['reminder_time', '09:00:00', 'Time of day to send reminders (24-hour format)'],
        ['reminder_sender_id', 'LiveOnBD', 'SMS sender ID for reminders']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO `reminder_settings` (`setting_name`, `setting_value`, `description`) VALUES (?, ?, ?)");
    
    foreach ($defaultSettings as $setting) {
        $stmt->execute($setting);
        echo "✅ Inserted setting: {$setting[0]}\n";
    }
    
    echo "\n🎉 Database setup completed successfully!\n";
    echo "You can now use the donor reminder functionality.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
