<?php

require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/Donor.php';
require_once __DIR__ . '/../classes/MedicalVerification.php';

class DonorService
{
    private $user;
    private $donor;
    private $medicalVerification;

    public function __construct(PDO $pdo)
    {
        $this->user = new User($pdo);
        $this->donor = new Donor($pdo);
        $this->medicalVerification = new MedicalVerification($pdo);
    }

    public function registerDonor(array $donorData): array
    {
        try {
            // Check if email is already registered
            if ($this->user->isEmailRegistered($donorData['email'])) {
                return ['success' => false, 'message' => 'Email already registered.'];
            }

            // Generate IDs
            $userId = 'US' . uniqid();
            $donorId = 'DN' . uniqid();

            // Prepare user data
            $userData = [
                'user_id' => $userId,
                'name' => $donorData['fullName'],
                'email' => $donorData['email'],
                'phone' => $donorData['phone'],
                'password_hash' => password_hash($donorData['password'], PASSWORD_BCRYPT),
                'role' => 'donor',
                'status' => 'inactive'
            ];

            // Prepare donor data
            $donorInfo = [
                'donor_id' => $donorId,
                'user_id' => $userId,
                'dob' => $donorData['dob'],
                'address' => $donorData['address'],
                'city' => $donorData['city'],
                'preferred_hospital_id' => $donorData['hospitalId'],
                'status' => 'not available'
            ];

            // Create user and donor records
            $this->user->createUser($userData);
            $this->donor->createDonor($donorInfo);

            return [
                'success' => true,
                'user_id' => $userId,
                'donor_id' => $donorId
            ];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
        }
    }

    public function updateDonorProfile(string $donorId, array $profileData): array
    {
        try {
            // Get donor info to get user_id
            $donor = $this->donor->getDonorById($donorId);
            if (!$donor) {
                return ['success' => false, 'message' => 'Donor not found'];
            }

            // Update user information
            $userData = [
                'name' => $profileData['name'],
                'email' => $profileData['email'],
                'phone' => $profileData['phone'] ?? ''
            ];
            $this->user->updateUser($donor['user_id'], $userData);

            // Update donor information
            $donorData = [
                'blood_type' => $profileData['blood_type'],
                'city' => $profileData['location'],
                'donor_image' => $profileData['donor_image'] ?? null
            ];
            $this->donor->updateDonor($donorId, $donorData);

            // Update age in medical verification if provided
            if (isset($profileData['age'])) {
                $this->medicalVerification->updateAge($donorId, $profileData['age']);
            }

            return ['success' => true, 'message' => 'Profile updated successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Profile update failed: ' . $e->getMessage()];
        }
    }

    public function getAllDonors(): array
    {
        try {
            return $this->donor->getAllDonors();
        } catch (Exception $e) {
            return ['error' => 'Failed to retrieve donors: ' . $e->getMessage()];
        }
    }

    public function getActiveDonors(): array
    {
        try {
            return $this->donor->getActiveDonors();
        } catch (Exception $e) {
            return ['error' => 'Failed to retrieve active donors: ' . $e->getMessage()];
        }
    }

    public function updateDonorStatus(string $donorId, string $status): array
    {
        try {
            $success = $this->donor->updateStatus($donorId, $status);
            if ($success) {
                return ['success' => true, 'message' => 'Status updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to update status'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Status update failed: ' . $e->getMessage()];
        }
    }

    public function getDonorById(string $donorId): array
    {
        try {
            $donor = $this->donor->getDonorById($donorId);
            if (!$donor) {
                return ['success' => false, 'message' => 'Donor not found'];
            }
            return ['success' => true, 'data' => $donor];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to retrieve donor: ' . $e->getMessage()];
        }
    }

    public function processDonation(string $donorId, array $donationData): array
    {
        try {
            // Update donor's last donation date
            $this->donor->updateLastDonationDate($donorId, date('Y-m-d H:i:s'));

            // Increment lives saved
            $this->donor->incrementLivesSaved($donorId);

            // Update donor status to 'not available' temporarily
            $this->donor->updateStatus($donorId, 'not available');

            return ['success' => true, 'message' => 'Donation processed successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Donation processing failed: ' . $e->getMessage()];
        }
    }

    public function verifyDonorEligibility(string $donorId): array
    {
        try {
            $donor = $this->donor->getDonorById($donorId);
            if (!$donor) {
                return ['success' => false, 'message' => 'Donor not found'];
            }

            // Check if donor has medical verification
            $verification = $this->medicalVerification->getVerificationByDonorId($donorId);
            if (!$verification) {
                return ['success' => false, 'message' => 'No medical verification found'];
            }

            // Check age eligibility (18-65 years)
            if ($verification['age'] < 18 || $verification['age'] > 65) {
                return ['success' => false, 'message' => 'Age not eligible for donation'];
            }

            // Check weight eligibility (minimum 50kg)
            if ($verification['weight_kg'] < 50) {
                return ['success' => false, 'message' => 'Weight not eligible for donation'];
            }

            return ['success' => true, 'message' => 'Donor is eligible for donation'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Eligibility check failed: ' . $e->getMessage()];
        }
    }
}
