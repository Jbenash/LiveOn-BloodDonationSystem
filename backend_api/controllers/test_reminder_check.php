<?php
// Simple test endpoint to trigger reminders manually
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    echo "=== Manual Reminder Trigger Test ===\n";
    echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

    // Get current interval setting
    $stmt = $pdo->prepare("SELECT setting_value FROM reminder_settings WHERE setting_name = 'reminder_interval_months'");
    $stmt->execute();
    $intervalSetting = $stmt->fetch(PDO::FETCH_ASSOC);
    $intervalMonths = $intervalSetting['setting_value'] ?? 6;

    echo "Current interval: {$intervalMonths} months\n\n";

    // Get donors needing reminders
    $stmt = $pdo->prepare("
        SELECT DISTINCT 
            d.donor_id,
            d.user_id,
            u.name,
            u.phone,
            u.email,
            d.status as donor_status,
            u.status as user_status,
            COALESCE(dr.last_reminder, '2000-01-01') as last_reminder,
            DATE_ADD(COALESCE(dr.last_reminder, d.registration_date), INTERVAL ? MONTH) as next_reminder_due
        FROM donors d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN (
            SELECT 
                donor_id, 
                MAX(sent_date) as last_reminder
            FROM donor_reminders 
            WHERE status = 'sent' AND reminder_type = '6_month_general'
            GROUP BY donor_id
        ) dr ON d.donor_id = dr.donor_id
        WHERE u.status = 'active' 
            AND d.status = 'available'
            AND u.phone IS NOT NULL 
            AND u.phone != ''
            AND (
                dr.last_reminder IS NULL 
                OR DATE_ADD(dr.last_reminder, INTERVAL ? MONTH) <= NOW()
            )
        ORDER BY next_reminder_due ASC
        LIMIT 5
    ");
    $stmt->execute([$intervalMonths, $intervalMonths]);
    $donors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($donors) . " donors needing reminders:\n\n";

    foreach ($donors as $donor) {
        echo "Donor: {$donor['name']} ({$donor['phone']})\n";
        echo "Last reminder: {$donor['last_reminder']}\n";
        echo "Next due: {$donor['next_reminder_due']}\n";
        echo "Current time: " . date('Y-m-d H:i:s') . "\n";

        // Check if really due
        $lastReminder = strtotime($donor['last_reminder']);
        $nextDue = strtotime($donor['next_reminder_due']);
        $now = time();

        if ($lastReminder === false || $lastReminder < strtotime('2001-01-01')) {
            echo "Status: First time - eligible for reminder\n";
        } else if ($now >= $nextDue) {
            echo "Status: Due for reminder (overdue by " . ($now - $nextDue) . " seconds)\n";
        } else {
            echo "Status: Not yet due (due in " . ($nextDue - $now) . " seconds)\n";
        }
        echo "---\n";
    }

    echo "\n=== Test completed ===\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
