<?php
header('Content-Type: application/json');
// Set CORS headers dynamically
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

require_once '../config/db_connection.php';

try {
    $db = new Database();
    $conn = $db->connect();

    // Get location from query parameter
    $location = isset($_GET['location']) ? $_GET['location'] : '';

    if (empty($location)) {
        // If no location provided, return all hospitals
        $sql = "SELECT * FROM hospitals ORDER BY name LIMIT 10";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
    } else {
        // Search hospitals by location
        $sql = "SELECT * FROM hospitals WHERE location LIKE :location OR name LIKE :location ORDER BY name LIMIT 10";
        $stmt = $conn->prepare($sql);
        $locationParam = "%$location%";
        $stmt->bindParam(':location', $locationParam);
        $stmt->execute();
    }

    $hospitals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the response
    $formattedHospitals = [];
    foreach ($hospitals as $hospital) {
        $formattedHospitals[] = [
            'id' => $hospital['hospital_id'],
            'name' => $hospital['name'],
            'address' => $hospital['location'],
            'city' => $hospital['location'],
            'phone' => $hospital['contact_phone'] ?? 'N/A',
            'email' => $hospital['contact_email'] ?? 'N/A',
            'rating' => '4.0', // Default rating since not in database
            'distance' => '2.5 km', // This would be calculated based on actual coordinates
            'blood_bank' => 'Yes', // Default since not in database
            'emergency_services' => 'Yes' // Default since not in database
        ];
    }

    echo json_encode([
        'success' => true,
        'hospitals' => $formattedHospitals,
        'location' => $location
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'General error',
        'message' => $e->getMessage()
    ]);
}
