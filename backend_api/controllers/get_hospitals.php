<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/db_connection.php';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get location from query parameter
    $location = isset($_GET['location']) ? $_GET['location'] : '';

    if (empty($location)) {
        // If no location provided, return all hospitals
        $sql = "SELECT * FROM hospitals ORDER BY hospital_name LIMIT 10";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
    } else {
        // Search hospitals by location (city)
        $sql = "SELECT * FROM hospitals WHERE city LIKE :location OR hospital_name LIKE :location ORDER BY hospital_name LIMIT 10";
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
            'name' => $hospital['hospital_name'],
            'address' => $hospital['address'] . ', ' . $hospital['city'],
            'city' => $hospital['city'],
            'phone' => $hospital['phone'] ?? 'N/A',
            'email' => $hospital['email'] ?? 'N/A',
            'rating' => $hospital['rating'] ?? '4.0',
            'distance' => '2.5 km', // This would be calculated based on actual coordinates
            'blood_bank' => $hospital['blood_bank'] ?? 'Yes',
            'emergency_services' => $hospital['emergency_services'] ?? 'Yes'
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
        'error' => 'Failed to fetch hospitals',
        'message' => $e->getMessage()
    ]);
}
