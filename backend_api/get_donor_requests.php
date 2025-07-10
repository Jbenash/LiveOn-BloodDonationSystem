<?php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

class DonorRequestsHandler
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function handle()
    {
        // SQL query to fetch inactive donors with latest OTP (any status/expiry)
        $sql = "
            SELECT 
                d.donor_id, 
                u.name AS donor_fullname, 
                u.email AS donor_email, 
                latest_otp.otp_code AS otp_number,
                u.status, 
                u.role
            FROM donors d
            INNER JOIN users u ON d.user_id = u.user_id
            LEFT JOIN (
                SELECT o1.user_id, o1.otp_code
                FROM otp_verification o1
                INNER JOIN (
                    SELECT user_id, MAX(created_at) AS latest_created
                    FROM otp_verification
                    GROUP BY user_id
                ) latest ON o1.user_id = latest.user_id AND o1.created_at = latest.latest_created
            ) AS latest_otp ON u.user_id = latest_otp.user_id
            WHERE u.role = 'donor' AND u.status = 'inactive'
        ";

        $result = $this->conn->query($sql);

        $donors = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $donors[] = $row;
            }
        }

        $this->conn->close();
        echo json_encode($donors);
    }
}

// DB Connection
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

$handler = new DonorRequestsHandler($conn);
$handler->handle();