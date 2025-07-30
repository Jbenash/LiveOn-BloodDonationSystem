<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../classes/Donor.php';
require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/OTP.php';
require_once __DIR__ . '/EmailService.php';
require_once __DIR__ . '/../classes/Validator.php';

class DonorService extends BaseService
{
    private $donor;
    private $user;
    private $otp;
    private $emailService;

    public function __construct(PDO $pdo, Validator $validator = null)
    {
        parent::__construct($pdo, $validator);
        $this->donor = new Donor($pdo);
        $this->user = new User($pdo);
        $this->otp = new OTP($pdo);
        $this->emailService = new EmailService($pdo, $validator);
    }

    public function registerDonor(array $donorData): array
    {
        try {
            // Validate required fields
            $validation = $this->validateData($donorData, [
                'fullName' => ['required', 'min:2', 'max:100', 'name'],
                'email' => ['required', 'email'],
                'password' => ['required', 'min:8'],
                'dob' => ['required', 'dob'],
                'address' => ['required', 'min:10'],
                'city' => ['required', 'min:2'],
                'phone' => ['required', 'phone'],
                'hospitalId' => ['required']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Sanitize input
            $sanitizedData = $this->sanitizeInput($donorData);

            // Check if email already exists
            if ($this->user->isEmailRegistered($sanitizedData['email'])) {
                return $this->errorResponse('Email already registered');
            }

            // Validate phone number (Sri Lankan format: 10 digits)
            if (!preg_match('/^\d{10}$/', preg_replace('/\D/', '', $sanitizedData['phone']))) {
                return $this->errorResponse('Phone number must be exactly 10 digits');
            }

            // Start transaction
            $this->pdo->beginTransaction();

            try {
                // Generate unique IDs
                $userId = 'US' . uniqid();
                $donorId = 'DN' . uniqid();

                // Hash password
                $passwordHash = password_hash($sanitizedData['password'], PASSWORD_BCRYPT);

                // Create user
                $userData = [
                    'user_id' => $userId,
                    'name' => $sanitizedData['fullName'],
                    'email' => $sanitizedData['email'],
                    'phone' => preg_replace('/\D/', '', $sanitizedData['phone']),
                    'password_hash' => $passwordHash,
                    'role' => 'donor',
                    'status' => 'inactive'
                ];

                $userCreated = $this->user->createUser($userData);
                if (!$userCreated) {
                    throw new Exception('Failed to create user');
                }

                // Create donor
                $donorData = [
                    'donor_id' => $donorId,
                    'user_id' => $userId,
                    'dob' => $sanitizedData['dob'],
                    'address' => $sanitizedData['address'],
                    'city' => $sanitizedData['city'],
                    'preferred_hospital_id' => $sanitizedData['hospitalId'],
                    'registration_date' => date('Y-m-d'),
                    'status' => 'not available'
                ];

                $donorCreated = $this->donor->createDonor($donorData);
                if (!$donorCreated) {
                    throw new Exception('Failed to create donor');
                }

                // Generate and store OTP
                $otp = $this->otp->generateAndStore($userId);

                // Create notification
                $this->createNotification($userId, "New donor registered: {$sanitizedData['fullName']}", 'info');

                // Send OTP email
                $emailResult = $this->emailService->sendOTP($sanitizedData['email'], $sanitizedData['fullName'], $otp);
                if (!$emailResult['success']) {
                    throw new Exception('Failed to send OTP email: ' . $emailResult['message']);
                }

                $this->pdo->commit();

                return $this->successResponse(
                    [
                        'user_id' => $userId,
                        'donor_id' => $donorId,
                        'email' => $sanitizedData['email']
                    ],
                    'Donor registered successfully. Please check your email for OTP verification.'
                );
            } catch (Exception $e) {
                $this->pdo->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function verifyOTP(string $userId, string $otpCode): array
    {
        try {
            // Validate inputs
            if (empty($userId) || empty($otpCode)) {
                return $this->errorResponse('User ID and OTP are required');
            }

            // Check if OTP is expired
            if ($this->otp->isOTPExpired($userId)) {
                return $this->errorResponse('OTP has expired. Please request a new one.');
            }

            // Verify OTP
            $isValid = $this->otp->verifyOTP($userId, $otpCode);
            if (!$isValid) {
                return $this->errorResponse('Invalid OTP code');
            }

            // Update user status to active
            $userUpdated = $this->user->updateStatus($userId, 'active');
            if (!$userUpdated) {
                return $this->errorResponse('Failed to activate user account');
            }

            // Get user data
            $user = $this->user->getUserById($userId);
            if (!$user) {
                return $this->errorResponse('User not found');
            }

            // Create success notification
            $this->createNotification($userId, 'Email verified successfully! Welcome to LiveOn.', 'success');

            return $this->successResponse(
                [
                    'user_id' => $userId,
                    'email' => $user['email'],
                    'name' => $user['name']
                ],
                'Email verified successfully! You can now log in to your account.'
            );
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getDonorProfile(string $donorId): array
    {
        try {
            $donor = $this->donor->getDonorWithUserInfo($donorId);
            if (!$donor) {
                return $this->errorResponse('Donor not found', [], 404);
            }

            return $this->successResponse($donor, 'Donor profile retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function updateDonorProfile(string $donorId, array $profileData): array
    {
        try {
            // Validate required fields
            $validation = $this->validateData($profileData, [
                'name' => ['required', 'min:2', 'max:100', 'name'],
                'email' => ['required', 'email'],
                'phone' => ['required', 'phone'],
                'city' => ['required', 'min:2'],
                'address' => ['required', 'min:10']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Check if donor exists
            $donor = $this->donor->getDonorById($donorId);
            if (!$donor) {
                return $this->errorResponse('Donor not found', [], 404);
            }

            // Sanitize input
            $sanitizedData = $this->sanitizeInput($profileData);

            // Start transaction
            $this->pdo->beginTransaction();

            try {
                // Update user data
                $userData = [
                    'name' => $sanitizedData['name'],
                    'email' => $sanitizedData['email'],
                    'phone' => preg_replace('/\D/', '', $sanitizedData['phone'])
                ];

                $userUpdated = $this->user->updateUser($donor['user_id'], $userData);
                if (!$userUpdated) {
                    throw new Exception('Failed to update user data');
                }

                // Update donor data
                $donorUpdateData = [
                    'city' => $sanitizedData['city'],
                    'address' => $sanitizedData['address']
                ];

                if (isset($sanitizedData['preferred_hospital_id'])) {
                    $donorUpdateData['preferred_hospital_id'] = $sanitizedData['preferred_hospital_id'];
                }

                $donorUpdated = $this->donor->updateDonor($donorId, $donorUpdateData);
                if (!$donorUpdated) {
                    throw new Exception('Failed to update donor data');
                }

                $this->pdo->commit();

                return $this->successResponse([], 'Donor profile updated successfully');
            } catch (Exception $e) {
                $this->pdo->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getDonorStats(): array
    {
        try {
            $stats = $this->donor->getDonorStats();
            return $this->successResponse($stats, 'Donor statistics retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function searchDonors(string $searchTerm): array
    {
        try {
            if (empty(trim($searchTerm))) {
                return $this->errorResponse('Search term is required');
            }

            $donors = $this->donor->searchDonors($searchTerm);
            return $this->successResponse($donors, 'Donor search completed successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function updateDonorStatus(string $donorId, string $status): array
    {
        try {
            // Validate status
            $validStatuses = ['available', 'not available', 'approved', 'rejected'];
            if (!in_array($status, $validStatuses)) {
                return $this->errorResponse('Invalid status value');
            }

            // Check if donor exists
            $donor = $this->donor->getDonorById($donorId);
            if (!$donor) {
                return $this->errorResponse('Donor not found', [], 404);
            }

            $updated = $this->donor->updateDonorStatus($donorId, $status);
            if (!$updated) {
                return $this->errorResponse('Failed to update donor status');
            }

            return $this->successResponse([], 'Donor status updated successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    private function createNotification(string $userId, string $message, string $type): void
    {
        try {
            $notificationId = 'NT' . uniqid();
            $sql = "INSERT INTO notifications (notification_id, user_id, message, type, status, timestamp) 
                    VALUES (?, ?, ?, ?, 'unread', NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$notificationId, $userId, $message, $type]);
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Failed to create notification: " . $e->getMessage());
        }
    }

    public function getUserById(string $userId): ?array
    {
        try {
            $user = $this->user->getUserById($userId);
            return $user ?: null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function generateAndStoreOTP(string $userId): string
    {
        try {
            return $this->otp->generateAndStore($userId);
        } catch (Exception $e) {
            throw new Exception("OTP generation failed: " . $e->getMessage());
        }
    }

    public function sendOTPEmail(string $email, string $name, string $otp): array
    {
        try {
            return $this->emailService->sendOTP($email, $name, $otp);
        } catch (Exception $e) {
            return $this->errorResponse('Email sending failed: ' . $e->getMessage());
        }
    }

    public function saveDonation(array $donationData): array
    {
        try {
            // Validate required fields
            $validation = $this->validateData($donationData, [
                'donor_id' => ['required'],
                'blood_type' => ['required'],
                'donation_date' => ['required'],
                'units_donated' => ['required'],
                'hospital_id' => ['required']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Sanitize input
            $sanitizedData = $this->sanitizeInput($donationData);

            // Check if donor exists
            $donor = $this->donor->getDonorById($sanitizedData['donor_id']);
            if (!$donor) {
                return $this->errorResponse('Donor not found');
            }

            // Start transaction
            $this->pdo->beginTransaction();

            try {
                // Generate unique donation ID
                $donationId = 'DO' . uniqid();

                // Prepare donation data
                $donationRecord = [
                    'donation_id' => $donationId,
                    'donor_id' => $sanitizedData['donor_id'],
                    'blood_type' => $sanitizedData['blood_type'],
                    'donation_date' => $sanitizedData['donation_date'],
                    'units_donated' => $sanitizedData['units_donated'],
                    'hospital_id' => $sanitizedData['hospital_id']
                ];

                // Insert donation record
                $sql = "INSERT INTO donations (donation_id, donor_id, blood_type, donation_date, units_donated, hospital_id) 
                        VALUES (?, ?, ?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $donationRecord['donation_id'],
                    $donationRecord['donor_id'],
                    $donationRecord['blood_type'],
                    $donationRecord['donation_date'],
                    $donationRecord['units_donated'],
                    $donationRecord['hospital_id']
                ]);

                // Update donor's lives saved count
                $this->donor->incrementLivesSaved($sanitizedData['donor_id']);

                // Update donor's dates after donation
                $this->updateDonorDatesAfterDonation($sanitizedData['donor_id'], $sanitizedData['donation_date']);

                // Note: Blood inventory is automatically updated by database trigger trg_update_blood_inventory
                // No need to call updateBloodInventory() manually

                // Create notification for donor
                $this->createNotification($donor['user_id'], 'Your blood donation has been successfully recorded. Thank you for saving lives!', 'donation');

                $this->pdo->commit();

                return $this->successResponse($donationRecord, 'Donation saved successfully');
            } catch (Exception $e) {
                $this->pdo->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    private function updateDonorDatesAfterDonation(string $donorId, string $donationDate): void
    {
        try {
            // Calculate next eligible date (6 months from donation date)
            $donationDateTime = new DateTime($donationDate);
            $nextEligibleDate = clone $donationDateTime;
            $nextEligibleDate->add(new DateInterval('P6M'));

            // Update donor's last_donation_date and next_eligible_date
            $sql = "UPDATE donors SET 
                    last_donation_date = :donation_date,
                    next_eligible_date = :next_eligible_date
                    WHERE donor_id = :donor_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'donation_date' => $donationDateTime->format('Y-m-d H:i:s'),
                'next_eligible_date' => $nextEligibleDate->format('Y-m-d'),
                'donor_id' => $donorId
            ]);
        } catch (Exception $e) {
            throw new Exception("Failed to update donor dates: " . $e->getMessage());
        }
    }

    private function updateBloodInventory(string $hospitalId, string $bloodType, int $volume): void
    {
        try {
            // Check if inventory record exists
            $sql = "SELECT * FROM blood_inventory WHERE hospital_id = ? AND blood_type = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$hospitalId, $bloodType]);
            $existingInventory = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingInventory) {
                // Update existing inventory
                $sql = "UPDATE blood_inventory SET units_available = units_available + ? WHERE hospital_id = ? AND blood_type = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$volume, $hospitalId, $bloodType]);
            } else {
                // Create new inventory record
                $sql = "INSERT INTO blood_inventory (blood_id, hospital_id, blood_type, units_available) VALUES (?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    'BLD' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    $hospitalId,
                    $bloodType,
                    $volume
                ]);
            }
        } catch (Exception $e) {
            throw new Exception("Failed to update blood inventory: " . $e->getMessage());
        }
    }
}
