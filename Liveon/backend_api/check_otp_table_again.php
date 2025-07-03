<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain"); // Use plain text for clear output

include 'db_connection.php';

echo "--- OTP Verification Table Check ---\n\n";

class OTPTableChecker
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function checkTable()
    {
        try {
            echo "\u2705 Database connection successful.\n\n";
            // 1. Check if table exists
            $stmt = $this->pdo->query("SHOW TABLES LIKE 'otp_verifications'");
            if ($stmt->rowCount() > 0) {
                echo "\u2705 Table 'otp_verifications' exists.\n\n";
                // 2. Show table structure
                echo "--- Table Schema ---\n";
                $desc = $this->pdo->query("DESCRIBE otp_verifications");
                $columns = $desc->fetchAll(PDO::FETCH_ASSOC);
                foreach ($columns as $col) {
                    echo "- Column: '{$col['Field']}', Type: '{$col['Type']}', Nullable: '{$col['Null']}', Key: '{$col['Key']}'\n";
                }
                echo "\n";
                // 3. Show recent data
                echo "--- Recent Data (Last 5 Entries) ---\n";
                $data = $this->pdo->query("SELECT id, user_id, otp_code, created_at, expires_at, verified_at FROM otp_verifications ORDER BY id DESC LIMIT 5");
                $rows = $data->fetchAll(PDO::FETCH_ASSOC);
                if (count($rows) > 0) {
                    foreach ($rows as $row) {
                        print_r($row);
                        echo "---------------------\n";
                    }
                } else {
                    echo "No data found in 'otp_verifications' table.\n";
                }
            } else {
                echo "\u274c FATAL: Table 'otp_verifications' does not exist.\n";
                echo "This is the root cause of the problem. Please create the table.\n";
            }
        } catch (PDOException $e) {
            echo "\u274c DATABASE ERROR: " . $e->getMessage() . "\n";
        } catch (Exception $e) {
            echo "\u274c SCRIPT ERROR: " . $e->getMessage() . "\n";
        }
    }
}

$db = new Database();
$pdo = $db->connect();
$checker = new OTPTableChecker($pdo);
$checker->checkTable();
