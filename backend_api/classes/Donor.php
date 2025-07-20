<?php

class Donor
{
    private $conn;
    private $table = 'donors';

    public function __construct(PDO $dbConn)
    {
        $this->conn = $dbConn;
    }

    public function createDonor(array $donorData): bool
    {
        try {
            $sql = "INSERT INTO {$this->table} (donor_id, user_id, dob, address, city, preferred_hospital_id, status) 
                    VALUES (:donor_id, :user_id, :dob, :address, :city, :preferred_hospital_id, :status)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':donor_id', $donorData['donor_id']);
            $stmt->bindValue(':user_id', $donorData['user_id']);
            $stmt->bindValue(':dob', $donorData['dob']);
            $stmt->bindValue(':address', $donorData['address']);
            $stmt->bindValue(':city', $donorData['city']);
            $stmt->bindValue(':preferred_hospital_id', $donorData['preferred_hospital_id']);
            $stmt->bindValue(':status', $donorData['status']);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Donor creation failed: " . $e->getMessage());
        }
    }

    public function updateDonor(string $donorId, array $donorData): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET 
                    blood_type = :blood_type, 
                    city = :city, 
                    donor_image = :donor_image 
                    WHERE donor_id = :donor_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':blood_type', $donorData['blood_type']);
            $stmt->bindValue(':city', $donorData['city']);
            $stmt->bindValue(':donor_image', $donorData['donor_image']);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Donor update failed: " . $e->getMessage());
        }
    }

    public function getDonorById(string $donorId): array|false
    {
        try {
            $sql = "SELECT d.*, u.name, u.email, u.phone 
                    FROM {$this->table} d 
                    JOIN users u ON d.user_id = u.user_id 
                    WHERE d.donor_id = :donor_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':donor_id', $donorId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new DonorException("Donor retrieval failed: " . $e->getMessage());
        }
    }

    public function getAllDonors(): array
    {
        try {
            $sql = "SELECT d.donor_id, u.name, u.email, d.blood_type, d.address, d.city, 
                           d.preferred_hospital_id, h.name AS preferred_hospital_name, 
                           d.last_donation_date, d.lives_saved, d.status, 
                           mv.verification_date
                    FROM {$this->table} d
                    INNER JOIN users u ON d.user_id = u.user_id
                    INNER JOIN medical_verifications mv ON d.donor_id = mv.donor_id
                    LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
                    WHERE u.role = 'donor'
                    ORDER BY mv.verification_date DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DonorException("Donors retrieval failed: " . $e->getMessage());
        }
    }

    public function getActiveDonors(): array
    {
        try {
            $sql = "SELECT d.donor_id, u.name, d.blood_type, u.phone AS contact, d.city AS location, 
                           d.last_donation_date AS lastDonation, d.status, d.preferred_hospital_id, 
                           h.name AS preferred_hospital_name, u.email, d.donor_image,
                           (SELECT mv.age FROM medical_verifications mv 
                            WHERE mv.donor_id = d.donor_id 
                            ORDER BY mv.verification_date DESC LIMIT 1) AS age
                    FROM {$this->table} d
                    JOIN users u ON d.user_id = u.user_id
                    LEFT JOIN hospitals h ON d.preferred_hospital_id = h.hospital_id
                    WHERE u.status = 'active'";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DonorException("Active donors retrieval failed: " . $e->getMessage());
        }
    }

    public function updateStatus(string $donorId, string $status): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET status = :status WHERE donor_id = :donor_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Status update failed: " . $e->getMessage());
        }
    }

    public function updateBloodType(string $donorId, string $bloodType): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET blood_type = :blood_type WHERE donor_id = :donor_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':blood_type', $bloodType);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Blood type update failed: " . $e->getMessage());
        }
    }

    public function getDonorByUserId(string $userId): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':user_id', $userId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new DonorException("Donor retrieval by user ID failed: " . $e->getMessage());
        }
    }

    public function updateLastDonationDate(string $donorId, string $date): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET last_donation_date = :date WHERE donor_id = :donor_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':date', $date);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Last donation date update failed: " . $e->getMessage());
        }
    }

    public function incrementLivesSaved(string $donorId): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET lives_saved = lives_saved + 1 WHERE donor_id = :donor_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':donor_id', $donorId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new DonorException("Lives saved increment failed: " . $e->getMessage());
        }
    }
}

class DonorException extends Exception
{
    public function __construct($message = "", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
