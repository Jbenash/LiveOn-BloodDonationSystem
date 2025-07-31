<?php

require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/Donor.php';
require_once __DIR__ . '/../classes/MedicalVerification.php';

class DonorService
{
    private $user;
    private $donor;
    private $medicalVerification;
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
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
            // Get donors with active user status
            $sql = "SELECT d.*, u.name, u.email, u.phone, u.status as user_status 
                    FROM donors d
                    JOIN users u ON d.user_id = u.user_id
                    WHERE u.status = 'active'
                    ORDER BY d.donor_id DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (Exception $e) {
            return ['error' => 'Failed to retrieve active donors: ' . $e->getMessage()];
        }
    }

    public function updateDonorStatus(string $donorId, string $status): array
    {
        try {
            $success = $this->donor->updateDonorStatus($donorId, $status);
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
            $this->donor->updateDonorStatus($donorId, 'not available');

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

    public function saveDonation(array $input): array
    {
        // Validate required fields
        $required_fields = ['donor_id', 'blood_type', 'donation_date', 'volume'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                return ['success' => false, 'error' => "Missing required field: $field"];
            }
        }
        $pdo = $this->pdo;
        try {
            // Generate unique donation_id
            $donation_id = 'DON' . date('YmdHis') . rand(100, 999);
            $sql = "INSERT INTO donations (donation_id, donor_id, blood_type, donation_date, units_donated, hospital_id) VALUES (:donation_id, :donor_id, :blood_type, :donation_date, :units_donated, :hospital_id)";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':donation_id', $donation_id);
            $stmt->bindParam(':donor_id', $input['donor_id']);
            $stmt->bindParam(':blood_type', $input['blood_type']);
            $stmt->bindParam(':donation_date', $input['donation_date']);
            $stmt->bindParam(':units_donated', $input['volume']);
            // Use hospital_id from input if provided, otherwise default to HS002
            $hospital_id = isset($input['hospital_id']) && !empty($input['hospital_id']) ? $input['hospital_id'] : 'HS002';
            $stmt->bindParam(':hospital_id', $hospital_id);
            $stmt->execute();
            // Update donors table status to 'not available' and last_donation_date
            $date = new \DateTime($input['donation_date'], new \DateTimeZone('UTC'));
            $date->setTimezone(new \DateTimeZone('Asia/Colombo'));
            $localDatetime = $date->format('Y-m-d H:i:s.v');
            $sql2 = "UPDATE donors SET status = 'not available', last_donation_date = :donation_date WHERE donor_id = :donor_id";
            $stmt2 = $pdo->prepare($sql2);
            $stmt2->bindParam(':donation_date', $localDatetime);
            $stmt2->bindParam(':donor_id', $input['donor_id']);
            $stmt2->execute();
            // Schedule background status update (not implemented here)

            // Fetch user_id for the donor
            $user_id = null;
            $userStmt = $pdo->prepare("SELECT user_id FROM donors WHERE donor_id = ?");
            $userStmt->execute([$input['donor_id']]);
            if ($row = $userStmt->fetch()) {
                $user_id = $row['user_id'];
            }
            // Insert notification for new donation
            if ($user_id) {
                $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, message, type, status, timestamp) VALUES (?, ?, ?, ?, NOW())");
                $notifStmt->execute([$user_id, "New donation recorded: $donation_id", 'success', 'unread']);
            }

            return [
                'success' => true,
                'message' => 'Donation saved successfully',
                'donation_id' => $donation_id
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Server error: ' . $e->getMessage()
            ];
        }
    }
}
