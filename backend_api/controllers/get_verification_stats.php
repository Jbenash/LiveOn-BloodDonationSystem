<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db_connection.php';

class VerificationStatsHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function handle()
    {
        // Get verification data grouped by date for the last 30 days
        $sql = "SELECT 
                    DATE(verification_date) as date,
                    COUNT(*) as count
                FROM medical_verifications 
                WHERE verification_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(verification_date)
                ORDER BY date ASC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $verificationData = [];
        while ($row = $stmt->fetch()) {
            $verificationData[] = [
                'date' => $row['date'],
                'count' => (int)$row['count']
            ];
        }

        // Get total statistics
        $sql2 = "SELECT 
                    COUNT(*) as total_verified,
                    COUNT(DISTINCT donor_id) as unique_donors,
                    MAX(verification_date) as latest_verification
                FROM medical_verifications";

        $stmt2 = $this->pdo->prepare($sql2);
        $stmt2->execute();
        $stats = $stmt2->fetch();

        echo json_encode([
            'verificationData' => $verificationData,
            'stats' => $stats
        ]);
    }
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $handler = new VerificationStatsHandler($pdo);
    $handler->handle();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}
