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
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }

    $donor_id = $input['donor_id'] ?? null;
    $reward_id = $input['reward_id'] ?? null;

    if (!$donor_id || !$reward_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Donor ID and Reward ID are required']);
        exit;
    }

    try {
        // Start transaction
        $pdo->beginTransaction();
        // Get donor's current points
        $stmt = $pdo->prepare("SELECT current_points, total_points_spent FROM donor_rewards WHERE donor_id = ?");
        $stmt->execute([$donor_id]);
        $donor_rewards = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$donor_rewards) {
            throw new Exception('Donor rewards record not found');
        }

        // Get reward details
        $partner_rewards = [
            1 => ['partner_name' => 'General Hospital', 'reward_description' => 'Health checkup voucher', 'points_required' => 500],
            2 => ['partner_name' => 'City Restaurant', 'reward_description' => 'Dining voucher', 'points_required' => 1000],
            3 => ['partner_name' => 'Grand Hotel', 'reward_description' => 'Hotel stay voucher', 'points_required' => 2000],
            4 => ['partner_name' => 'Travel Agency', 'reward_description' => 'Travel voucher', 'points_required' => 5000]
        ];

        if (!isset($partner_rewards[$reward_id])) {
            throw new Exception('Invalid reward ID');
        }

        $reward = $partner_rewards[$reward_id];
        $current_points = $donor_rewards['current_points'];
        $points_required = $reward['points_required'];

        // Check if donor has enough points
        if ($current_points < $points_required) {
            throw new Exception('Insufficient points. You need ' . $points_required . ' points but only have ' . $current_points);
        }

        // Generate redemption code
        $redemption_code = 'RED' . date('YmdHis') . str_pad($reward_id, 2, '0', STR_PAD_LEFT);

        // Insert redemption record using existing table structure
        $stmt = $pdo->prepare("
            INSERT INTO reward_redemptions 
            (donor_id, redemption_type, points_spent, redemption_value, redemption_code, expiry_date, status) 
            VALUES (?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'approved')
        ");
        $stmt->execute([
            $donor_id,
            $reward['partner_name'] . ' - ' . $reward['reward_description'],
            $points_required,
            $points_required, // Using points as redemption value
            $redemption_code
        ]);

        // Update donor points
        $new_current_points = $current_points - $points_required;
        $new_total_spent = $donor_rewards['total_points_spent'] + $points_required;

        $stmt = $pdo->prepare("
            UPDATE donor_rewards 
            SET current_points = ?, 
                total_points_spent = ?,
                updated_at = NOW()
            WHERE donor_id = ?
        ");
        $stmt->execute([$new_current_points, $new_total_spent, $donor_id]);

        // Get donor info for notification
        $stmt = $pdo->prepare("SELECT user_id FROM donors WHERE donor_id = ?");
        $stmt->execute([$donor_id]);
        $donor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($donor) {
            // Insert notification
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, message, type, status, timestamp) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $message = "Reward redeemed: {$reward['reward_description']} from {$reward['partner_name']}. Redemption code: {$redemption_code}";
            $stmt->execute([$donor['user_id'], $message, 'success', 'unread']);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Reward redeemed successfully!',
            'data' => [
                'redemption_code' => $redemption_code,
                'reward' => $reward,
                'points_spent' => $points_required,
                'remaining_points' => $new_current_points,
                'expires_at' => date('Y-m-d', strtotime('+6 months'))
            ]
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
