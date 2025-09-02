<?php
header('Content-Type: application/json');
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../classes/Core/Database.php';

try {
    $database = \LiveOn\classes\Core\Database::getInstance();
    $pdo = $database->connect();

    $donor_id = $_GET['donor_id'] ?? null;

    if (!$donor_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Donor ID is required']);
        exit;
    }

    // Check if donor exists first
    $stmt = $pdo->prepare("SELECT donor_id FROM donors WHERE donor_id = ?");
    $stmt->execute([$donor_id]);
    $donor_exists = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$donor_exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Donor not found']);
        exit;
    }

    // Get donor's rewards data from donor_rewards table
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM donor_rewards 
            WHERE donor_id = ?
        ");
        $stmt->execute([$donor_id]);
        $rewards_data = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // If query fails, create default data
        $rewards_data = [
            'donor_id' => $donor_id,
            'current_points' => 0,
            'current_streak' => 0,
            'last_donation_date' => null
        ];
    }

    // If no rewards record exists, create one
    if (!$rewards_data) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO donor_rewards (donor_id, current_points, current_streak) 
                VALUES (?, 0, 0)
            ");
            $stmt->execute([$donor_id]);

            $stmt = $pdo->prepare("
                SELECT * FROM donor_rewards 
                WHERE donor_id = ?
            ");
            $stmt->execute([$donor_id]);
            $rewards_data = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // If insert fails, create a default rewards data structure
            $rewards_data = [
                'donor_id' => $donor_id,
                'current_points' => 0,
                'current_streak' => 0,
                'last_donation_date' => null
            ];
        }
    }

    // Get donor's donation count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as donation_count
        FROM donations 
        WHERE donor_id = ?
    ");
    $stmt->execute([$donor_id]);
    $donation_count = $stmt->fetch(PDO::FETCH_ASSOC)['donation_count'];

    // Define tier system based on donation count
    $tier_system = [
        ['name' => 'Bronze Donor', 'min_donations' => 1, 'badge' => '🥉', 'discount' => 10],
        ['name' => 'Silver Donor', 'min_donations' => 6, 'badge' => '🥈', 'discount' => 15],
        ['name' => 'Gold Donor', 'min_donations' => 16, 'badge' => '🥇', 'discount' => 20],
        ['name' => 'Platinum Donor', 'min_donations' => 31, 'badge' => '💎', 'discount' => 25]
    ];

    // Determine current tier
    $current_tier = null;
    $next_tier = null;

    for ($i = 0; $i < count($tier_system); $i++) {
        if ($donation_count >= $tier_system[$i]['min_donations']) {
            $current_tier = $tier_system[$i];
            if ($i < count($tier_system) - 1) {
                $next_tier = $tier_system[$i + 1];
            }
        } else {
            if ($i === 0) {
                $current_tier = $tier_system[0];
            }
            $next_tier = $tier_system[$i];
            break;
        }
    }

    // Calculate progress to next tier
    $progress_to_next = 0;
    if ($next_tier) {
        $denominator = $next_tier['min_donations'] - $current_tier['min_donations'];
        if ($denominator > 0) {
            $progress_to_next = (($donation_count - $current_tier['min_donations']) / $denominator) * 100;
            $progress_to_next = max(0, min(100, $progress_to_next));
        } else {
            $progress_to_next = 100; // Already at max tier
        }
    }

    // Define achievements
    $achievements = [
        [
            'id' => 1,
            'achievement_name' => 'First Donation',
            'badge_icon' => '🎯',
            'description' => 'Completed your first donation',
            'points_reward' => 100,
            'trigger' => 'donation_count >= 1'
        ],
        [
            'id' => 2,
            'achievement_name' => 'Life Saver',
            'badge_icon' => '🏥',
            'description' => 'Made an emergency donation',
            'points_reward' => 200,
            'trigger' => 'emergency_donation = true'
        ],
        [
            'id' => 3,
            'achievement_name' => 'Consistency Champion',
            'badge_icon' => '📈',
            'description' => '12 consecutive months of donations',
            'points_reward' => 500,
            'trigger' => 'streak >= 12'
        ],
        [
            'id' => 4,
            'achievement_name' => 'Emergency Hero',
            'badge_icon' => '🚨',
            'description' => 'Responded to emergency call',
            'points_reward' => 150,
            'trigger' => 'emergency_response = true'
        ],
        [
            'id' => 5,
            'achievement_name' => 'Weekend Warrior',
            'badge_icon' => '⚡',
            'description' => 'Donated on weekend',
            'points_reward' => 125,
            'trigger' => 'weekend_donation = true'
        ],
        [
            'id' => 6,
            'achievement_name' => '10th Donation',
            'badge_icon' => '🔟',
            'description' => 'Completed 10 donations',
            'points_reward' => 200,
            'trigger' => 'donation_count >= 10'
        ],
        [
            'id' => 7,
            'achievement_name' => '50th Donation',
            'badge_icon' => '5️⃣0️⃣',
            'description' => 'Completed 50 donations',
            'points_reward' => 500,
            'trigger' => 'donation_count >= 50'
        ],
        [
            'id' => 8,
            'achievement_name' => '100th Donation',
            'badge_icon' => '💯',
            'description' => 'Completed 100 donations',
            'points_reward' => 1000,
            'trigger' => 'donation_count >= 100'
        ]
    ];

    // Define partner rewards
    $partner_rewards = [
        [
            'id' => 1,
            'partner_name' => 'General Hospital',
            'partner_type' => 'hospital',
            'reward_description' => 'Health checkup voucher',
            'discount_percentage' => null,
            'points_required' => 500
        ],
        [
            'id' => 2,
            'partner_name' => 'City Restaurant',
            'partner_type' => 'restaurant',
            'reward_description' => 'Dining voucher',
            'discount_percentage' => 15,
            'points_required' => 1000
        ],
        [
            'id' => 3,
            'partner_name' => 'Grand Hotel',
            'partner_type' => 'hotel',
            'reward_description' => 'Hotel stay voucher',
            'discount_percentage' => 20,
            'points_required' => 2000
        ],
        [
            'id' => 4,
            'partner_name' => 'Travel Agency',
            'partner_type' => 'travel',
            'reward_description' => 'Travel voucher',
            'discount_percentage' => 25,
            'points_required' => 5000
        ]
    ];

    // Get recent donations for points history
    $stmt = $pdo->prepare("
        SELECT 
            donation_id,
            donation_date,
            'Regular donation' as reason,
            100 as points_earned
        FROM donations 
        WHERE donor_id = ?
        ORDER BY donation_date DESC 
        LIMIT 10
    ");
    $stmt->execute([$donor_id]);
    $points_history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate current streak (consecutive months)
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(donation_date, '%Y-%m') as month,
            COUNT(*) as donations_in_month
        FROM donations 
        WHERE donor_id = ?
        GROUP BY DATE_FORMAT(donation_date, '%Y-%m')
        ORDER BY month DESC
    ");
    $stmt->execute([$donor_id]);
    $monthly_donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $current_streak = 0;
    $current_month = date('Y-m');

    foreach ($monthly_donations as $month_data) {
        if ($month_data['month'] === $current_month) {
            $current_streak++;
            $current_month = date('Y-m', strtotime($current_month . ' -1 month'));
        } else {
            break;
        }
    }

    $response = [
        'success' => true,
        'data' => [
            'donor_id' => $donor_id,
            'donation_count' => $donation_count,
            'current_tier' => $current_tier,
            'next_tier' => $next_tier,
            'progress_to_next_tier' => round($progress_to_next, 1),
            'rewards_data' => [
                'current_points' => $rewards_data['current_points'] ?? 0,
                'current_streak' => $rewards_data['current_streak'] ?? $current_streak,
                'last_donation_date' => $rewards_data['last_donation_date'] ?? null,
                'total_points_earned' => $rewards_data['total_points_earned'] ?? 0,
                'total_points_spent' => $rewards_data['total_points_spent'] ?? 0
            ],
            'achievements' => $achievements,
            'partner_rewards' => $partner_rewards,
            'points_history' => $points_history
        ]
    ];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
