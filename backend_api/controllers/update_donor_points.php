<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $donor_id = $input['donor_id'] ?? null;
    $donation_id = $input['donation_id'] ?? null;
    $points_to_add = $input['points'] ?? 100; // Default 100 points per donation
    $donation_type = $input['donation_type'] ?? 'regular'; // regular, emergency, weekend, etc.

    if (!$donor_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Donor ID is required']);
        exit;
    }

    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    // Check if donor has a rewards record
    $stmt = $pdo->prepare("SELECT * FROM rewards WHERE donor_id = ?");
    $stmt->execute([$donor_id]);
    $rewards_record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$rewards_record) {
        // Create new rewards record
        $stmt = $pdo->prepare("
            INSERT INTO rewards (donor_id, points, badge) 
            VALUES (?, ?, 'Bronze Donor')
        ");
        $stmt->execute([$donor_id, $points_to_add]);
    } else {
        // Update existing rewards record
        $new_points = $rewards_record['points'] + $points_to_add;

        // Determine new badge based on total points or donations
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as donation_count 
            FROM donations 
            WHERE donor_id = ?
        ");
        $stmt->execute([$donor_id]);
        $donation_count = $stmt->fetch(PDO::FETCH_ASSOC)['donation_count'] + 1; // +1 for current donation

        $new_badge = 'Bronze Donor';
        if ($donation_count >= 31) {
            $new_badge = 'Platinum Donor';
        } elseif ($donation_count >= 16) {
            $new_badge = 'Gold Donor';
        } elseif ($donation_count >= 6) {
            $new_badge = 'Silver Donor';
        }

        $stmt = $pdo->prepare("
            UPDATE rewards 
            SET points = ?, badge = ?, last_updated = CURRENT_TIMESTAMP 
            WHERE donor_id = ?
        ");
        $stmt->execute([$new_points, $new_badge, $donor_id]);
    }

    // Log the points transaction (optional - you can create a separate table for this)
    // For now, we'll just return success

    $response = [
        'success' => true,
        'message' => 'Points updated successfully',
        'data' => [
            'donor_id' => $donor_id,
            'points_added' => $points_to_add,
            'donation_type' => $donation_type,
            'new_total_points' => ($rewards_record['points'] ?? 0) + $points_to_add
        ]
    ];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
