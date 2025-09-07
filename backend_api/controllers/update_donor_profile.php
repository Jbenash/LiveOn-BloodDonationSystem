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

require_once __DIR__ . '/../config/db_connection.php';

$db = new Database();
$conn = $db->connect();

$donor_id = $_POST['donorId'] ?? null;
$name = $_POST['name'] ?? null;
$location = $_POST['location'] ?? null;
$email = $_POST['email'] ?? null;

if (!$donor_id || !$name || !$location || !$email) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

// Validate name to prevent numeric input
if (!preg_match('/^[a-zA-Z\s]+$/', $name) || is_numeric(str_replace(' ', '', $name))) {
    echo json_encode(["success" => false, "message" => "Name must contain only letters and spaces, and cannot be purely numeric"]);
    exit();
}

// Note: Age and Blood type cannot be changed for safety and verification reasons

// Validate phone number format if provided
$phone = $_POST['phone'] ?? null;
if ($phone) {
    // Check if phone contains only digits
    if (!preg_match('/^[0-9]+$/', $phone)) {
        echo json_encode(["success" => false, "message" => "Phone number can only contain numbers"]);
        exit();
    }

    // Check if phone has exactly 10 digits (Sri Lankan format)
    if (strlen($phone) !== 10) {
        echo json_encode(["success" => false, "message" => "Phone number must be exactly 10 digits (Sri Lankan format)"]);
        exit();
    }
}

// Note: Blood type cannot be changed for safety reasons

// Handle image upload and removal
$imagePath = null;
$removeAvatar = isset($_POST['removeAvatar']) && $_POST['removeAvatar'] === '1';

if ($removeAvatar) {
    // Set imagePath to null to remove the avatar
    $imagePath = null;
} else if (isset($_FILES['profilePicFile']) && $_FILES['profilePicFile']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/../../uploads/donor_images/';
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

    // Update donors table (city, donor_image only - blood type cannot be changed)
    $sql2 = "UPDATE donors SET city = :city";
    if ($removeAvatar) {
        $sql2 .= ", donor_image = NULL";
    } else if ($imagePath !== null) {
        $sql2 .= ", donor_image = :donor_image";
    }
    $sql2 .= " WHERE donor_id = :donor_id";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bindParam(':city', $location);
    $stmt2->bindParam(':donor_id', $donor_id);
    if (!$removeAvatar && $imagePath !== null) {
        $stmt2->bindParam(':donor_image', $imagePath);
    }
    $stmt2->execute();

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully",
        "imagePath" => $imagePath,
        "avatarRemoved" => $removeAvatar
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
