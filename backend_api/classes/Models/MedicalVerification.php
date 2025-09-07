<?php

require_once __DIR__ . '/../Core/BaseModel.php';
require_once __DIR__ . '/../Core/Exceptions.php';

use LiveOn\Exceptions\DatabaseException;

class MedicalVerification extends BaseModel
{
    protected function getTableName(): string
    {
        return 'medical_verifications';
    }

    protected function getPrimaryKey(): string
    {
        return 'verification_id';
    }

    public function createVerification(array $verificationData): bool
    {
        try {
            return $this->create($verificationData);
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification creation failed: " . $e->getMessage());
        }
    }

    public function getVerificationByDonorId(string $donorId): ?array
    {
        try {
            $conditions = ['donor_id' => $donorId];
            $orderBy = ['verification_date' => 'DESC'];
            $results = $this->findAll($conditions, $orderBy, 1);
            return $results[0] ?? null;
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification retrieval failed: " . $e->getMessage());
        }
    }

    public function getAllVerifications(): array
    {
        try {
            $sql = "SELECT mv.*, d.donor_id, u.name as donor_name, u.email as donor_email 
                    FROM {$this->getTableName()} mv
                    JOIN donors d ON mv.donor_id = d.donor_id
                    JOIN users u ON d.user_id = u.user_id
                    ORDER BY mv.verification_date DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verifications retrieval failed: " . $e->getMessage());
        }
    }

    public function updateVerification(string $verificationId, array $verificationData): bool
    {
        try {
            return $this->update($verificationId, $verificationData);
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification update failed: " . $e->getMessage());
        }
    }

    public function deleteVerification(string $verificationId): bool
    {
        try {
            return $this->delete($verificationId);
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification deletion failed: " . $e->getMessage());
        }
    }

    public function getVerificationStats(): array
    {
        try {
            // Get total verifications
            $totalVerifications = $this->count();

            // Get verifications by month
            $sql = "SELECT DATE_FORMAT(verification_date, '%Y-%m') as month, COUNT(*) as count 
                     FROM {$this->getTableName()} 
                     GROUP BY DATE_FORMAT(verification_date, '%Y-%m') 
                     ORDER BY month DESC 
                     LIMIT 6";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $verificationsByMonth = $stmt->fetchAll();

            // Get average age
            $sql = "SELECT AVG(age) as average_age FROM {$this->getTableName()} WHERE age IS NOT NULL";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $averageAge = $stmt->fetchColumn();

            return [
                'total_verifications' => $totalVerifications,
                'verifications_by_month' => $verificationsByMonth,
                'average_age' => round($averageAge, 1)
            ];
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification stats retrieval failed: " . $e->getMessage());
        }
    }

    public function getVerificationsByDateRange(string $startDate, string $endDate): array
    {
        try {
            $sql = "SELECT mv.*, d.donor_id, u.name as donor_name 
                    FROM {$this->getTableName()} mv
                    JOIN donors d ON mv.donor_id = d.donor_id
                    JOIN users u ON d.user_id = u.user_id
                    WHERE mv.verification_date BETWEEN :start_date AND :end_date
                    ORDER BY mv.verification_date DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':start_date', $startDate);
            $stmt->bindValue(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verifications by date range retrieval failed: " . $e->getMessage());
        }
    }

    public function updateAge(string $donorId, int $age): bool
    {
        try {
            $sql = "UPDATE {$this->getTableName()} SET age = :age WHERE donor_id = :donor_id ORDER BY verification_date DESC LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':age', $age);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DatabaseException("Age update failed: " . $e->getMessage());
        }
    }

    public function getVerificationById(string $verificationId): ?array
    {
        try {
            return $this->findById($verificationId);
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verification retrieval failed: " . $e->getMessage());
        }
    }

    public function getVerificationsByMroId(string $mroId): array
    {
        try {
            $conditions = ['mro_id' => $mroId];
            $orderBy = ['verification_date' => 'DESC'];
            return $this->findAll($conditions, $orderBy);
        } catch (PDOException $e) {
            throw new DatabaseException("Medical verifications by MRO retrieval failed: " . $e->getMessage());
        }
    }

    public function getRecentVerifications(int $limit = 10): array
    {
        try {
            $orderBy = ['verification_date' => 'DESC'];
            return $this->findAll([], $orderBy, $limit);
        } catch (PDOException $e) {
            throw new DatabaseException("Recent medical verifications retrieval failed: " . $e->getMessage());
        }
    }
}
