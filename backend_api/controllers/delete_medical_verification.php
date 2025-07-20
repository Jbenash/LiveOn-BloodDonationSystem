<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db_connection.php';

try {
    $database = new Database();
    $pdo = $database->connect();

    $data = json_decode(file_get_contents('php://input'), true);

    $verification_id = $data['verification_id'] ?? null;
    $donor_id = $data['donor_id'] ?? null;

    if (!$verification_id || !$donor_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing verification_id or donor_id"]);
        exit();
    }

    // Start transaction
    $pdo->beginTransaction();

    try {
        // First get the user_id from donors table
        $sql1 = "SELECT user_id FROM donors WHERE donor_id = ?";
        $stmt1 = $pdo->prepare($sql1);
        $stmt1->execute([$donor_id]);
        $row = $stmt1->fetch();

        if (!$row) {
            throw new Exception("Donor not found");
        }

        $user_id = $row['user_id'];

        // Delete from medical_verifications table
        $sql2 = "DELETE FROM medical_verifications WHERE verification_id = ? AND donor_id = ?";
        $stmt2 = $pdo->prepare($sql2);
        $stmt2->execute([$verification_id, $donor_id]);

        if ($stmt2->rowCount() === 0) {
            throw new Exception("No medical verification record found to delete");
        }

        // Update users table status to 'inactive'
        $sql3 = "UPDATE users SET status = 'inactive' WHERE user_id = ?";
        $stmt3 = $pdo->prepare($sql3);
        $stmt3->execute([$user_id]);

        // Commit transaction
        $pdo->commit();

        echo json_encode(["success" => true, "message" => "Medical verification deleted and user status updated to pending"]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
