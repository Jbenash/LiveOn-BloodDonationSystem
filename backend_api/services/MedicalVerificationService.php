<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../classes/MedicalVerification.php';
require_once __DIR__ . '/../classes/Validator.php';

class MedicalVerificationService extends BaseService
{
    private $medicalVerification;

    public function __construct(PDO $pdo, Validator $validator = null)
    {
        parent::__construct($pdo, $validator);
        $this->medicalVerification = new MedicalVerification($pdo);
    }

    public function createVerification(array $verificationData): array
    {
        try {
            // Validate required fields
            $validation = $this->validateData($verificationData, [
                'donor_id' => ['required'],
                'mro_id' => ['required'],
                'height_cm' => ['required', 'numeric', 'min:100', 'max:250'],
                'weight_kg' => ['required', 'numeric', 'min:30', 'max:200'],
                'medical_history' => ['required'],
                'age' => ['required', 'numeric', 'min:18', 'max:65']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Generate verification ID if not provided
            if (!isset($verificationData['verification_id'])) {
                $verificationData['verification_id'] = $this->generateUniqueId('MV');
            }

            // Set verification date if not provided
            if (!isset($verificationData['verification_date'])) {
                $verificationData['verification_date'] = date('Y-m-d H:i:s');
            }

            // Create verification
            $success = $this->medicalVerification->createVerification($verificationData);

            if ($success) {
                return $this->successResponse(
                    ['verification_id' => $verificationData['verification_id']],
                    'Medical verification created successfully'
                );
            } else {
                return $this->errorResponse('Failed to create medical verification');
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getVerificationByDonorId(string $donorId): array
    {
        try {
            $verification = $this->medicalVerification->getVerificationByDonorId($donorId);

            if ($verification) {
                return $this->successResponse($verification, 'Medical verification retrieved successfully');
            } else {
                return $this->errorResponse('Medical verification not found for this donor', [], 404);
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getAllVerifications(): array
    {
        try {
            $verifications = $this->medicalVerification->getAllVerifications();
            return $this->successResponse($verifications, 'All medical verifications retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function updateVerification(string $verificationId, array $verificationData): array
    {
        try {
            // Validate required fields
            $validation = $this->validateData($verificationData, [
                'height_cm' => ['required', 'numeric', 'min:100', 'max:250'],
                'weight_kg' => ['required', 'numeric', 'min:30', 'max:200'],
                'medical_history' => ['required'],
                'age' => ['required', 'numeric', 'min:18', 'max:65']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Check if verification exists
            $existingVerification = $this->medicalVerification->getVerificationById($verificationId);
            if (!$existingVerification) {
                return $this->errorResponse('Medical verification not found', [], 404);
            }

            // Update verification
            $success = $this->medicalVerification->updateVerification($verificationId, $verificationData);

            if ($success) {
                return $this->successResponse([], 'Medical verification updated successfully');
            } else {
                return $this->errorResponse('Failed to update medical verification');
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function deleteVerification(string $verificationId): array
    {
        try {
            // Check if verification exists
            $existingVerification = $this->medicalVerification->getVerificationById($verificationId);
            if (!$existingVerification) {
                return $this->errorResponse('Medical verification not found', [], 404);
            }

            // Delete verification
            $success = $this->medicalVerification->deleteVerification($verificationId);

            if ($success) {
                return $this->successResponse([], 'Medical verification deleted successfully');
            } else {
                return $this->errorResponse('Failed to delete medical verification');
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getVerificationStats(): array
    {
        try {
            $stats = $this->medicalVerification->getVerificationStats();
            return $this->successResponse($stats, 'Medical verification stats retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getVerificationsByDateRange(string $startDate, string $endDate): array
    {
        try {
            // Validate dates
            if (!strtotime($startDate) || !strtotime($endDate)) {
                return $this->errorResponse('Invalid date format');
            }

            if (strtotime($startDate) > strtotime($endDate)) {
                return $this->errorResponse('Start date cannot be after end date');
            }

            $verifications = $this->medicalVerification->getVerificationsByDateRange($startDate, $endDate);
            return $this->successResponse($verifications, 'Verifications retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function updateAge(string $donorId, int $age): array
    {
        try {
            // Validate age
            if ($age < 18 || $age > 65) {
                return $this->errorResponse('Age must be between 18 and 65');
            }

            $success = $this->medicalVerification->updateAge($donorId, $age);

            if ($success) {
                return $this->successResponse([], 'Age updated successfully');
            } else {
                return $this->errorResponse('Failed to update age');
            }
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getVerificationsByMroId(string $mroId): array
    {
        try {
            $verifications = $this->medicalVerification->getVerificationsByMroId($mroId);
            return $this->successResponse($verifications, 'MRO verifications retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function getRecentVerifications(int $limit = 10): array
    {
        try {
            if ($limit < 1 || $limit > 100) {
                return $this->errorResponse('Limit must be between 1 and 100');
            }

            $verifications = $this->medicalVerification->getRecentVerifications($limit);
            return $this->successResponse($verifications, 'Recent verifications retrieved successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }
}
