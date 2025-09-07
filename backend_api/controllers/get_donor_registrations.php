<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set error handler to catch all errors
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

require_once __DIR__ . '/../helpers/mro_auth.php';

// Check MRO authentication (includes CORS, session init, and auth check)
$currentUser = checkMROSession();

// Include required files and use statements
require_once __DIR__ . '/../classes/Core/Database.php';

use \LiveOn\classes\Core\Database;

try {
    if (!class_exists('\LiveOn\classes\Core\Database')) {
        throw new Exception('Database class not found');
    }

    $database = Database::getInstance();
    if (!$database) {
        throw new Exception('Failed to get database instance');
    }

    $pdo = $database->getConnection();
    if (!$pdo) {
        throw new Exception('Failed to get database connection');
    }
    $user_id = $_SESSION['user_id'];

    // Get hospital_id for this MRO
    $stmt = $pdo->prepare('SELECT hospital_id FROM mro_officers WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !$row['hospital_id']) {
        echo json_encode(['error' => 'Hospital not found for this MRO']);
        exit();
    }

    $hospital_id = $row['hospital_id'];

    $sql = "SELECT DISTINCT d.donor_id, u.name AS full_name, u.email, d.blood_type AS blood_group, 
            d.address, d.city, d.preferred_hospital_id, h.name AS preferred_hospital_name, d.last_donation_date, d.lives_saved, d.status,
            mv.verification_date AS verification_date
    FROM donors d
    INNER JOIN users u ON d.user_id = u.user_id
    LEFT JOIN medical_verifications mv ON d.donor_id = mv.donor_id
    LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
    WHERE d.preferred_hospital_id = ?";

    try {
        $stmt = $pdo->prepare($sql);
        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . print_r($pdo->errorInfo(), true));
        }

        $result = $stmt->execute([$hospital_id]);
        if (!$result) {
            throw new Exception("Failed to execute statement: " . print_r($stmt->errorInfo(), true));
        }

        $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($registrations === false) {
            throw new Exception("Failed to fetch results: " . print_r($stmt->errorInfo(), true));
        }
    } catch (PDOException $e) {
        throw new Exception("Database query error: " . $e->getMessage());
    }

    echo json_encode([
        'success' => true,
        'registrations' => $registrations
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    $error = [
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    error_log(print_r($error, true));
    echo json_encode($error);
} catch (Exception $e) {
    http_response_code(500);
    $error = [
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    error_log(print_r($error, true));
    echo json_encode($error);
}
