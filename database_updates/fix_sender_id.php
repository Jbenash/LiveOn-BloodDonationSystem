<?php
require_once __DIR__ . '/../backend_api/config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    echo "Updating sender ID to use authorized sender...\n";

    // Common authorized sender IDs for text.lk
    $authorizedSenders = ['NotifyLK', 'TextLK', 'SMS']; // These are usually pre-authorized

    // Try 'NotifyLK' first (most common default)
    $newSenderId = 'NotifyLK';

    $stmt = $pdo->prepare("UPDATE reminder_settings SET setting_value = ? WHERE setting_name = 'reminder_sender_id'");
    $stmt->execute([$newSenderId]);

    echo "✅ Updated sender ID to: $newSenderId\n";
    echo "This sender ID is usually pre-authorized with text.lk accounts.\n\n";

    echo "You can also try these alternatives if NotifyLK doesn't work:\n";
    foreach ($authorizedSenders as $sender) {
        echo "- $sender\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
