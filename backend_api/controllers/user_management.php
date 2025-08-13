<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../classes/Core/Database.php';
require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/ResponseHandler.php';

// Set CORS headers and handle preflight
setCorsHeaders();
handlePreflight();

// Initialize session
initSession();

class UserManagementController
{
    private $userModel;
    private $responseHandler;
    private $pdo;

    public function __construct()
    {
        $database = \LiveOn\classes\Core\Database::getInstance();
        $this->pdo = $database->connect();
        $this->userModel = new User($this->pdo);
        $this->responseHandler = new ResponseHandler();
    }

    /**
     * Get all users by role
     */
    public function getUsersByRole(): void
    {
        try {
            $this->requireMethod('GET');
            $role = $_GET['role'] ?? '';

            if (empty($role)) {
                $this->responseHandler->sendError(400, 'Role parameter is required');
                return;
            }

            $users = $this->userModel->getUsersByRole($role);
            $this->responseHandler->sendSuccess([
                'users' => $users,
                'count' => count($users)
            ]);
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    /**
     * Check if users exist for a specific role
     */
    public function checkUsersExist(): void
    {
        try {
            $this->requireMethod('GET');
            $role = $_GET['role'] ?? '';

            if (empty($role)) {
                $this->responseHandler->sendError(400, 'Role parameter is required');
                return;
            }

            $users = $this->userModel->getUsersByRole($role);
            $exists = count($users) > 0;

            $this->responseHandler->sendSuccess([
                'role' => $role,
                'exists' => $exists,
                'count' => count($users),
                'users' => $users
            ]);
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    /**
     * Create a user using proper OOP approach
     */
    public function createUser(): void
    {
        try {
            $this->requireMethod('POST');
            $this->requireRole('admin'); // Only admins can create users

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                $this->responseHandler->sendError(400, 'Invalid JSON input');
                return;
            }

            // Validate required fields
            $requiredFields = ['name', 'email', 'phone', 'password', 'role'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    $this->responseHandler->sendError(400, "Missing required field: $field");
                    return;
                }
            }

            // Check if email already exists
            if ($this->userModel->isEmailRegistered($input['email'])) {
                $this->responseHandler->sendError(400, 'Email already registered');
                return;
            }

            // Generate user ID
            $userId = 'US' . strtoupper(substr(md5(uniqid()), 0, 8));

            // Prepare user data
            $userData = [
                'user_id' => $userId,
                'name' => $input['name'],
                'email' => $input['email'],
                'phone' => $input['phone'],
                'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
                'role' => $input['role'],
                'status' => $input['status'] ?? 'active'
            ];

            // Create user using User class
            $success = $this->userModel->createUser($userData);

            if ($success) {
                // Create additional records based on role
                $this->createRoleSpecificRecords($userId, $input);

                $this->responseHandler->sendSuccess([
                    'message' => 'User created successfully',
                    'user' => [
                        'user_id' => $userId,
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'role' => $userData['role'],
                        'status' => $userData['status']
                    ]
                ]);
            } else {
                $this->responseHandler->sendError(500, 'Failed to create user');
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    /**
     * Create role-specific records (hospital, MRO, etc.)
     */
    private function createRoleSpecificRecords(string $userId, array $input): void
    {
        switch ($input['role']) {
            case 'hospital':
                $this->createHospitalRecord($userId, $input);
                break;
            case 'mro':
                $this->createMRORecord($userId, $input);
                break;
            case 'donor':
                $this->createDonorRecord($userId, $input);
                break;
        }
    }

    private function createHospitalRecord(string $userId, array $input): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO hospitals (user_id, name, location, contact_phone, contact_email) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $input['hospital_name'] ?? $input['name'],
            $input['location'] ?? 'Unknown',
            $input['phone'],
            $input['email']
        ]);

        $hospitalId = $this->pdo->lastInsertId();

        // Add blood inventory
        $bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        foreach ($bloodTypes as $bloodType) {
            $stmt = $this->pdo->prepare("
                INSERT INTO blood_inventory (hospital_id, blood_type, units_available) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$hospitalId, $bloodType, rand(5, 20)]);
        }
    }

    private function createMRORecord(string $userId, array $input): void
    {
        // Get first available hospital
        $stmt = $this->pdo->query("SELECT hospital_id FROM hospitals LIMIT 1");
        $hospital = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$hospital) {
            throw new Exception('No hospitals available. Please create a hospital first.');
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO mro_officers (user_id, hospital_id, name, contact_phone, contact_email) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $hospital['hospital_id'],
            $input['name'],
            $input['phone'],
            $input['email']
        ]);
    }

    private function createDonorRecord(string $userId, array $input): void
    {
        // Donor records are created through the registration process
        // This is handled in register_donor.php
    }

    private function requireMethod(string $method): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== $method) {
            $this->responseHandler->sendError(405, "Method not allowed. Use $method");
        }
    }

    private function requireRole(string $role): void
    {
        $currentUser = getCurrentUser();
        if (!$currentUser || $currentUser['role'] !== $role) {
            $this->responseHandler->sendError(403, "Access denied. Requires $role role");
        }
    }
}

// Route the request
$controller = new UserManagementController();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_users':
        $controller->getUsersByRole();
        break;
    case 'check_exists':
        $controller->checkUsersExist();
        break;
    case 'create_user':
        $controller->createUser();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
        break;
}
