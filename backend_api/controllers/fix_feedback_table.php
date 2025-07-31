<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/db_connection.php';

try {
    // Use Database class for connection
    $db = new Database();
    $pdo = $db->connect();

    // Check if columns exist
    $checkColumnsQuery = "SHOW COLUMNS FROM feedback LIKE 'type'";
    $stmt = $pdo->prepare($checkColumnsQuery);
    $stmt->execute();
    $typeExists = $stmt->rowCount() > 0;

    $checkColumnsQuery = "SHOW COLUMNS FROM feedback LIKE 'status'";
    $stmt = $pdo->prepare($checkColumnsQuery);
    $stmt->execute();
    $statusExists = $stmt->rowCount() > 0;

    $checkColumnsQuery = "SHOW COLUMNS FROM feedback LIKE 'subject'";
    $stmt = $pdo->prepare($checkColumnsQuery);
    $stmt->execute();
    $subjectExists = $stmt->rowCount() > 0;

    $checkColumnsQuery = "SHOW COLUMNS FROM feedback LIKE 'name'";
    $stmt = $pdo->prepare($checkColumnsQuery);
    $stmt->execute();
    $nameExists = $stmt->rowCount() > 0;

    $checkColumnsQuery = "SHOW COLUMNS FROM feedback LIKE 'email'";
    $stmt = $pdo->prepare($checkColumnsQuery);
    $stmt->execute();
    $emailExists = $stmt->rowCount() > 0;

    // Add missing columns
    $alterQueries = [];

    if (!$typeExists) {
        $alterQueries[] = "ADD COLUMN type ENUM('feedback', 'admin_contact') DEFAULT 'feedback'";
    }

    if (!$statusExists) {
        $alterQueries[] = "ADD COLUMN status ENUM('unread', 'read') DEFAULT 'unread'";
    }

    if (!$subjectExists) {
        $alterQueries[] = "ADD COLUMN subject VARCHAR(255) DEFAULT NULL";
    }

    if (!$nameExists) {
        $alterQueries[] = "ADD COLUMN name VARCHAR(255) DEFAULT NULL";
    }

    if (!$emailExists) {
        $alterQueries[] = "ADD COLUMN email VARCHAR(255) DEFAULT NULL";
    }

    if (!empty($alterQueries)) {
        $alterQuery = "ALTER TABLE feedback " . implode(", ", $alterQueries);
        $stmt = $pdo->prepare($alterQuery);
        $stmt->execute();
    }

    // Insert some sample admin contact messages if none exist
    $checkAdminMessagesQuery = "SELECT COUNT(*) as count FROM feedback WHERE type = 'admin_contact'";
    $stmt = $pdo->prepare($checkAdminMessagesQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] == 0) {
        // Insert sample admin contact messages
        $sampleMessages = [
            [
                'feedback_id' => 'FB' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'name' => 'John Smith',
                'email' => 'john.smith@email.com',
                'subject' => 'Blood Donation Inquiry',
                'message' => 'I would like to know more about the blood donation process and requirements.',
                'type' => 'admin_contact',
                'status' => 'unread',
                'created_at' => date('Y-m-d H:i:s', strtotime('-2 days'))
            ],
            [
                'feedback_id' => 'FB' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@email.com',
                'subject' => 'Hospital Registration Request',
                'message' => 'Our hospital would like to register with your blood donation platform.',
                'type' => 'admin_contact',
                'status' => 'unread',
                'created_at' => date('Y-m-d H:i:s', strtotime('-1 day'))
            ],
            [
                'feedback_id' => 'FB' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'name' => 'Dr. Michael Brown',
                'email' => 'dr.brown@hospital.com',
                'subject' => 'MRO Officer Registration',
                'message' => 'I am a Medical Registration Officer and would like to register with your system.',
                'type' => 'admin_contact',
                'status' => 'unread',
                'created_at' => date('Y-m-d H:i:s')
            ]
        ];

        foreach ($sampleMessages as $message) {
            $insertQuery = "INSERT INTO feedback (feedback_id, name, email, subject, message, type, status, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($insertQuery);
            $stmt->execute([
                $message['feedback_id'],
                $message['name'],
                $message['email'],
                $message['subject'],
                $message['message'],
                $message['type'],
                $message['status'],
                $message['created_at']
            ]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Feedback table structure updated successfully',
        'changes' => [
            'type_column_added' => !$typeExists,
            'status_column_added' => !$statusExists,
            'subject_column_added' => !$subjectExists,
            'name_column_added' => !$nameExists,
            'email_column_added' => !$emailExists
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
