<?php

require_once __DIR__ . '/../Core/BaseModel.php';
require_once __DIR__ . '/../Core/Exceptions.php';

use LiveOn\Exceptions\DatabaseException;

class Donor extends BaseModel
{
    protected function getTableName(): string
    {
        return 'donors';
    }

    protected function getPrimaryKey(): string
    {
        return 'donor_id';
    }

    public function createDonor(array $donorData): bool
    {
        try {
            return $this->create($donorData);
        } catch (PDOException $e) {
            throw new DatabaseException("Donor creation failed: " . $e->getMessage());
        }
    }

    public function getDonorByUserId(string $userId): ?array
    {
        try {
            $conditions = ['user_id' => $userId];
            $results = $this->findAll($conditions);
            return $results[0] ?? null;
        } catch (PDOException $e) {
            throw new DatabaseException("Donor retrieval failed: " . $e->getMessage());
        }
    }

    public function getDonorById(string $donorId): ?array
    {
        try {
            return $this->findById($donorId);
        } catch (PDOException $e) {
            throw new DatabaseException("Donor retrieval failed: " . $e->getMessage());
        }
    }

    public function updateDonor(string $donorId, array $donorData): bool
    {
        try {
            return $this->update($donorId, $donorData);
        } catch (PDOException $e) {
            throw new DatabaseException("Donor update failed: " . $e->getMessage());
        }
    }

    public function deleteDonor(string $donorId): bool
    {
        try {
            return $this->delete($donorId);
        } catch (PDOException $e) {
            throw new DatabaseException("Donor deletion failed: " . $e->getMessage());
        }
    }

    public function getAllDonors(): array
    {
        try {
            $sql = "SELECT d.*, u.name, u.email, u.phone, u.status as user_status 
                    FROM {$this->getTableName()} d
                    JOIN users u ON d.user_id = u.user_id
                    ORDER BY d.donor_id DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DatabaseException("Donors retrieval failed: " . $e->getMessage());
        }
    }

    public function getDonorsByHospital(string $hospitalId): array
    {
        try {
            $conditions = ['preferred_hospital_id' => $hospitalId];
            return $this->findAll($conditions);
        } catch (PDOException $e) {
            throw new DatabaseException("Donors by hospital retrieval failed: " . $e->getMessage());
        }
    }

    public function getAvailableDonors(): array
    {
        try {
            $conditions = ['status' => 'available'];
            return $this->findAll($conditions);
        } catch (PDOException $e) {
            throw new DatabaseException("Available donors retrieval failed: " . $e->getMessage());
        }
    }

    public function getDonorStats(): array
    {
        try {
            // Get total donors
            $totalDonors = $this->count();

            // Get donors by status
            $sql = "SELECT status, COUNT(*) as count FROM {$this->getTableName()} GROUP BY status";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $donorsByStatus = $stmt->fetchAll();

            // Get donors by blood type
            $sql = "SELECT blood_type, COUNT(*) as count FROM {$this->getTableName()} WHERE blood_type IS NOT NULL GROUP BY blood_type";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $donorsByBloodType = $stmt->fetchAll();

            return [
                'total_donors' => $totalDonors,
                'donors_by_status' => $donorsByStatus,
                'donors_by_blood_type' => $donorsByBloodType
            ];
        } catch (PDOException $e) {
            throw new DatabaseException("Donor stats retrieval failed: " . $e->getMessage());
        }
    }

    public function updateDonorStatus(string $donorId, string $status): bool
    {
        try {
            return $this->update($donorId, ['status' => $status]);
        } catch (PDOException $e) {
            throw new DatabaseException("Donor status update failed: " . $e->getMessage());
        }
    }

    public function updateLastDonationDate(string $donorId, string $donationDate): bool
    {
        try {
            return $this->update($donorId, ['last_donation_date' => $donationDate]);
        } catch (PDOException $e) {
            throw new DatabaseException("Last donation date update failed: " . $e->getMessage());
        }
    }

    public function incrementLivesSaved(string $donorId): bool
    {
        try {
            $sql = "UPDATE {$this->getTableName()} SET lives_saved = lives_saved + 3 WHERE donor_id = :donor_id";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute(['donor_id' => $donorId]);
        } catch (PDOException $e) {
            throw new DatabaseException("Lives saved increment failed: " . $e->getMessage());
        }
    }

    public function getDonorWithUserInfo(string $donorId): ?array
    {
        try {
            $sql = "SELECT d.*, u.name, u.email, u.phone, u.status as user_status 
                    FROM {$this->getTableName()} d
                    JOIN users u ON d.user_id = u.user_id
                    WHERE d.donor_id = :donor_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['donor_id' => $donorId]);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            throw new DatabaseException("Donor with user info retrieval failed: " . $e->getMessage());
        }
    }

    public function searchDonors(string $searchTerm): array
    {
        try {
            $sql = "SELECT d.*, u.name, u.email, u.phone 
                    FROM {$this->getTableName()} d
                    JOIN users u ON d.user_id = u.user_id
                    WHERE u.name LIKE :search OR u.email LIKE :search OR d.donor_id LIKE :search
                    ORDER BY u.name ASC";

            $stmt = $this->pdo->prepare($sql);
            $searchPattern = "%{$searchTerm}%";
            $stmt->execute(['search' => $searchPattern]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DatabaseException("Donor search failed: " . $e->getMessage());
        }
    }
}
