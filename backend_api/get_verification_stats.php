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

class VerificationStatsHandler
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
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

        $result = $this->conn->query($sql);

        $verificationData = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $verificationData[] = [
                    'date' => $row['date'],
                    'count' => (int)$row['count']
                ];
            }
        }

        // Get total statistics
        $sql2 = "SELECT 
                    COUNT(*) as total_verified,
                    COUNT(DISTINCT donor_id) as unique_donors,
                    MAX(verification_date) as latest_verification
                FROM medical_verifications";

        $result2 = $this->conn->query($sql2);
        $stats = $result2->fetch_assoc();

        $this->conn->close();

        echo json_encode([
            'verificationData' => $verificationData,
            'stats' => $stats
        ]);
    }
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "liveon_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$handler = new VerificationStatsHandler($conn);
$handler->handle();
