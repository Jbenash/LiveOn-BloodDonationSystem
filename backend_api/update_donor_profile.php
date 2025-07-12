<?php
// backend_api/update_donor_profile.php
$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

$db = new Database();
$conn = $db->connect();

$donor_id = $_POST['donorId'] ?? null;
$name = $_POST['name'] ?? null;
$blood_type = $_POST['bloodType'] ?? null;
$age = $_POST['age'] ?? null;
$location = $_POST['location'] ?? null;
$email = $_POST['email'] ?? null;

if (!$donor_id || !$name || !$blood_type || !$age || !$location || !$email) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

// Handle image upload
$imagePath = null;
if (isset($_FILES['profilePicFile']) && $_FILES['profilePicFile']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/uploads/donor_images/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $ext = pathinfo($_FILES['profilePicFile']['name'], PATHINFO_EXTENSION);
    $fileName = 'donor_' . $donor_id . '_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $fileName;
    if (move_uploaded_file($_FILES['profilePicFile']['tmp_name'], $targetPath)) {
        $imagePath = 'uploads/donor_images/' . $fileName;
    }
}

try {
    // Update users table (name, email)
    $stmt1 = $conn->prepare("UPDATE users u JOIN donors d ON u.user_id = d.user_id SET u.name = :name, u.email = :email WHERE d.donor_id = :donor_id");
    $stmt1->bindParam(':name', $name);
    $stmt1->bindParam(':email', $email);
    $stmt1->bindParam(':donor_id', $donor_id);
    $stmt1->execute();

    // Update donors table (blood_type, city, donor_image)
    $sql2 = "UPDATE donors SET blood_type = :blood_type, city = :city";
    if ($imagePath) {
        $sql2 .= ", donor_image = :donor_image";
    }
    $sql2 .= " WHERE donor_id = :donor_id";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bindParam(':blood_type', $blood_type);
    $stmt2->bindParam(':city', $location);
    $stmt2->bindParam(':donor_id', $donor_id);
    if ($imagePath) {
        $stmt2->bindParam(':donor_image', $imagePath);
    }
    $stmt2->execute();

    // Optionally update age in medical_verifications
    $stmt3 = $conn->prepare("UPDATE medical_verifications SET age = :age WHERE donor_id = :donor_id ORDER BY verification_date DESC LIMIT 1");
    $stmt3->bindParam(':age', $age);
    $stmt3->bindParam(':donor_id', $donor_id);
    $stmt3->execute();

    echo json_encode(["success" => true, "message" => "Profile updated successfully", "imagePath" => $imagePath]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} 