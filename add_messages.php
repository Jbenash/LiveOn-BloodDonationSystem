<?php
require_once 'backend_api/config/db_connection.php';

try {
    $db = new Database();
    $pdo = $db->connect();

    // Add sample feedback messages
    $messages = [
        ['FB008', 'US001', 'donor', 'I would like to know more about the donation process and eligibility criteria.', 0],
        ['FB009', 'US003', 'hospital', 'Can we get more detailed reports on blood inventory levels?', 0],
        ['FB010', 'US002', 'mro', 'The medical verification process is working well. Keep up the good work!', 0],
        ['FB011', 'US007', 'hospital', 'We need urgent blood supply for emergency cases. Please prioritize.', 0],
        ['FB012', 'US008', 'donor', 'The donation experience was excellent. Staff were very professional.', 1],
        ['FB013', 'US010', 'mro', 'Can we have more training sessions for new MRO officers?', 0]
    ];

    $stmt = $pdo->prepare("INSERT INTO feedback (feedback_id, user_id, role, message, approved, created_at) VALUES (?, ?, ?, ?, ?, NOW())");

    foreach ($messages as $message) {
        try {
            $stmt->execute($message);
            echo "Added message: " . $message[0] . "\n";
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                echo "Message " . $message[0] . " already exists, skipping...\n";
            } else {
                echo "Error adding message " . $message[0] . ": " . $e->getMessage() . "\n";
            }
        }
    }

    echo "Sample messages added successfully!\n";

    // Check unread count
    $unreadStmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM feedback WHERE approved = 0 AND role IN ('donor', 'hospital', 'mro')");
    $unreadStmt->execute();
    $unreadResult = $unreadStmt->fetch(PDO::FETCH_ASSOC);
    echo "Unread messages count: " . $unreadResult['unread_count'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
