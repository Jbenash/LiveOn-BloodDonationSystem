<?php

class MedicalVerification
{
    private $conn;
    private $table = 'medical_verifications';

    public function __construct(PDO $dbConn)
    {
        $this->conn = $dbConn;
    }

    public function createVerification(array $verificationData): bool
    {
        try {
            $sql = "INSERT INTO {$this->table} (verification_id, donor_id, mro_id, height_cm, weight_kg, medical_history, doctor_notes, verification_date, age) 
                    VALUES (:verification_id, :donor_id, :mro_id, :height_cm, :weight_kg, :medical_history, :doctor_notes, :verification_date, :age)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':verification_id', $verificationData['verification_id']);
            $stmt->bindValue(':donor_id', $verificationData['donor_id']);
            $stmt->bindValue(':mro_id', $verificationData['mro_id']);
            $stmt->bindValue(':height_cm', $verificationData['height_cm']);
            $stmt->bindValue(':weight_kg', $verificationData['weight_kg']);
            $stmt->bindValue(':medical_history', $verificationData['medical_history']);
            $stmt->bindValue(':doctor_notes', $verificationData['doctor_notes']);
            $stmt->bindValue(':verification_date', $verificationData['verification_date']);
            $stmt->bindValue(':age', $verificationData['age']);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verification creation failed: " . $e->getMessage());
        }
    }

    public function getVerificationByDonorId(string $donorId): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE donor_id = :donor_id ORDER BY verification_date DESC LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':donor_id', $donorId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verification retrieval failed: " . $e->getMessage());
        }
    }

    public function getAllVerifications(): array
    {
        try {
            $sql = "SELECT mv.*, d.donor_id, u.name as donor_name, u.email as donor_email 
                    FROM {$this->table} mv
                    JOIN donors d ON mv.donor_id = d.donor_id
                    JOIN users u ON d.user_id = u.user_id
                    ORDER BY mv.verification_date DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verifications retrieval failed: " . $e->getMessage());
        }
    }

    public function updateVerification(string $verificationId, array $verificationData): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET 
                    height_cm = :height_cm, 
                    weight_kg = :weight_kg, 
                    medical_history = :medical_history, 
                    doctor_notes = :doctor_notes, 
                    age = :age 
                    WHERE verification_id = :verification_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':height_cm', $verificationData['height_cm']);
            $stmt->bindValue(':weight_kg', $verificationData['weight_kg']);
            $stmt->bindValue(':medical_history', $verificationData['medical_history']);
            $stmt->bindValue(':doctor_notes', $verificationData['doctor_notes']);
            $stmt->bindValue(':age', $verificationData['age']);
            $stmt->bindValue(':verification_id', $verificationId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verification update failed: " . $e->getMessage());
        }
    }

    public function deleteVerification(string $verificationId): bool
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE verification_id = :verification_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':verification_id', $verificationId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verification deletion failed: " . $e->getMessage());
        }
    }

    public function getVerificationStats(): array
    {
        try {
            // Get total verifications
            $sql1 = "SELECT COUNT(*) as total_verifications FROM {$this->table}";
            $stmt1 = $this->conn->prepare($sql1);
            $stmt1->execute();
            $totalVerifications = $stmt1->fetchColumn();

            // Get verifications by month
            $sql2 = "SELECT DATE_FORMAT(verification_date, '%Y-%m') as month, COUNT(*) as count 
                     FROM {$this->table} 
                     GROUP BY DATE_FORMAT(verification_date, '%Y-%m') 
                     ORDER BY month DESC 
                     LIMIT 6";
            $stmt2 = $this->conn->prepare($sql2);
            $stmt2->execute();
            $verificationsByMonth = $stmt2->fetchAll();

            // Get average age
            $sql3 = "SELECT AVG(age) as average_age FROM {$this->table} WHERE age IS NOT NULL";
            $stmt3 = $this->conn->prepare($sql3);
            $stmt3->execute();
            $averageAge = $stmt3->fetchColumn();

            return [
                'total_verifications' => (int)$totalVerifications,
                'verifications_by_month' => $verificationsByMonth,
                'average_age' => round($averageAge, 1)
            ];
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verification stats retrieval failed: " . $e->getMessage());
        }
    }

    public function getVerificationsByDateRange(string $startDate, string $endDate): array
    {
        try {
            $sql = "SELECT mv.*, d.donor_id, u.name as donor_name 
                    FROM {$this->table} mv
                    JOIN donors d ON mv.donor_id = d.donor_id
                    JOIN users u ON d.user_id = u.user_id
                    WHERE mv.verification_date BETWEEN :start_date AND :end_date
                    ORDER BY mv.verification_date DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':start_date', $startDate);
            $stmt->bindValue(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Medical verifications by date range retrieval failed: " . $e->getMessage());
        }
    }

    public function updateAge(string $donorId, int $age): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET age = :age WHERE donor_id = :donor_id ORDER BY verification_date DESC LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':age', $age);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new MedicalVerificationException("Age update failed: " . $e->getMessage());
        }
    }
}

class MedicalVerificationException extends Exception
{
    public function __construct($message = "", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
