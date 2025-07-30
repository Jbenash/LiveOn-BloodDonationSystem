<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../classes/ResponseHandler.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/Validator.php';
require_once __DIR__ . '/../services/DonorService.php';

class DonorController extends BaseController
{
    private $donorService;

    public function __construct()
    {
        $database = Database::getInstance();
        $pdo = $database->connect();
        $validator = new Validator();
        $donorService = new DonorService($pdo, $validator);
        $responseHandler = new ResponseHandler();
        parent::__construct($donorService, $responseHandler);
        $this->donorService = $donorService;
    }

    public function registerDonor(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->responseHandler->sendValidationError(['general' => 'Invalid JSON input']);
                return;
            }

            $result = $this->donorService->registerDonor($input);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendValidationError($result['errors'] ?? [], $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function verifyOTP(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->responseHandler->sendValidationError(['general' => 'Invalid JSON input']);
                return;
            }

            $userId = $input['user_id'] ?? '';
            $otpCode = $input['otp_code'] ?? '';

            if (empty($userId) || empty($otpCode)) {
                $this->responseHandler->sendValidationError([
                    'user_id' => 'User ID is required',
                    'otp_code' => 'OTP code is required'
                ]);
                return;
            }

            $result = $this->donorService->verifyOTP($userId, $otpCode);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendValidationError($result['errors'] ?? [], $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getDonorProfile(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $donorId = $_GET['donor_id'] ?? '';
            if (empty($donorId)) {
                $this->responseHandler->sendValidationError(['donor_id' => 'Donor ID is required']);
                return;
            }

            $result = $this->donorService->getDonorProfile($donorId);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(404, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function updateDonorProfile(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->responseHandler->sendValidationError(['general' => 'Invalid JSON input']);
                return;
            }

            $donorId = $input['donor_id'] ?? '';
            if (empty($donorId)) {
                $this->responseHandler->sendValidationError(['donor_id' => 'Donor ID is required']);
                return;
            }

            // Remove donor_id from profile data
            unset($input['donor_id']);
            $profileData = $input;

            $result = $this->donorService->updateDonorProfile($donorId, $profileData);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendValidationError($result['errors'] ?? [], $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getDonorStats(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $this->requireRole('admin'); // Only admins can view stats

            $result = $this->donorService->getDonorStats();

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(500, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function searchDonors(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $searchTerm = $_GET['search'] ?? '';
            if (empty(trim($searchTerm))) {
                $this->responseHandler->sendValidationError(['search' => 'Search term is required']);
                return;
            }

            $result = $this->donorService->searchDonors($searchTerm);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendValidationError($result['errors'] ?? [], $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function updateDonorStatus(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->responseHandler->sendValidationError(['general' => 'Invalid JSON input']);
                return;
            }

            $donorId = $input['donor_id'] ?? '';
            $status = $input['status'] ?? '';

            if (empty($donorId) || empty($status)) {
                $this->responseHandler->sendValidationError([
                    'donor_id' => 'Donor ID is required',
                    'status' => 'Status is required'
                ]);
                return;
            }

            $result = $this->donorService->updateDonorStatus($donorId, $status);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendValidationError($result['errors'] ?? [], $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function resendOTP(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responseHandler->sendMethodNotAllowed();
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $this->responseHandler->sendValidationError(['general' => 'Invalid JSON input']);
                return;
            }

            $userId = $input['user_id'] ?? '';
            if (empty($userId)) {
                $this->responseHandler->sendValidationError(['user_id' => 'User ID is required']);
                return;
            }

            // Get user data
            $user = $this->donorService->getUserById($userId);
            if (!$user) {
                $this->responseHandler->sendError(404, 'User not found');
                return;
            }

            // Generate new OTP
            $otp = $this->donorService->generateAndStoreOTP($userId);

            // Send OTP email
            $emailResult = $this->donorService->sendOTPEmail($user['email'], $user['name'], $otp);

            if ($emailResult['success']) {
                $this->responseHandler->sendSuccess(
                    ['user_id' => $userId],
                    'New OTP sent successfully. Please check your email.'
                );
            } else {
                $this->responseHandler->sendError(500, 'Failed to send OTP email: ' . $emailResult['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }
}
