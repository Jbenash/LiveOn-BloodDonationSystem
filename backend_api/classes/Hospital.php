<?php

class Hospital
{
    private $conn;
    private $table = 'hospitals';

    public function __construct(PDO $dbConn)
    {
        $this->conn = $dbConn;
    }

    public function createHospital(array $hospitalData): bool
    {
        try {
            $sql = "INSERT INTO {$this->table} (hospital_id, user_id, name, location, contact_email, contact_phone) 
                    VALUES (:hospital_id, :user_id, :name, :location, :contact_email, :contact_phone)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':hospital_id', $hospitalData['hospital_id']);
            $stmt->bindValue(':user_id', $hospitalData['user_id']);
            $stmt->bindValue(':name', $hospitalData['name']);
            $stmt->bindValue(':location', $hospitalData['location']);
            $stmt->bindValue(':contact_email', $hospitalData['contact_email']);
            $stmt->bindValue(':contact_phone', $hospitalData['contact_phone']);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new HospitalException("Hospital creation failed: " . $e->getMessage());
        }
    }

    public function getHospitalById(string $hospitalId): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE hospital_id = :hospital_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':hospital_id', $hospitalId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new HospitalException("Hospital retrieval failed: " . $e->getMessage());
        }
    }

    public function getHospitalByUserId(string $userId): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':user_id', $userId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new HospitalException("Hospital retrieval by user ID failed: " . $e->getMessage());
        }
    }

    public function getAllHospitals(): array
    {
        try {
            $sql = "SELECT hospital_id, name, location, contact_email, contact_phone FROM {$this->table} ORDER BY hospital_id DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new HospitalException("Hospitals retrieval failed: " . $e->getMessage());
        }
    }

    public function updateHospital(string $hospitalId, array $hospitalData): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET 
                    name = :name, 
                    location = :location, 
                    contact_email = :contact_email, 
                    contact_phone = :contact_phone 
                    WHERE hospital_id = :hospital_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':name', $hospitalData['name']);
            $stmt->bindValue(':location', $hospitalData['location']);
            $stmt->bindValue(':contact_email', $hospitalData['contact_email']);
            $stmt->bindValue(':contact_phone', $hospitalData['contact_phone']);
            $stmt->bindValue(':hospital_id', $hospitalId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new HospitalException("Hospital update failed: " . $e->getMessage());
        }
    }

    public function getBloodInventory(string $hospitalId): array
    {
        try {
            $sql = "SELECT blood_id, blood_type, units_available FROM blood_inventory WHERE hospital_id = :hospital_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':hospital_id', $hospitalId);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new HospitalException("Blood inventory retrieval failed: " . $e->getMessage());
        }
    }

    public function updateBloodInventory(string $hospitalId, string $bloodType, int $units): bool
    {
        try {
            $sql = "UPDATE blood_inventory SET units_available = :units WHERE hospital_id = :hospital_id AND blood_type = :blood_type";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':units', $units);
            $stmt->bindValue(':hospital_id', $hospitalId);
            $stmt->bindValue(':blood_type', $bloodType);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new HospitalException("Blood inventory update failed: " . $e->getMessage());
        }
    }

    public function getEmergencyRequests(string $hospitalId): array
    {
        try {
            $sql = "SELECT blood_type, status, required_units, created_at FROM emergency_requests WHERE hospital_id = :hospital_id ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':hospital_id', $hospitalId);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new HospitalException("Emergency requests retrieval failed: " . $e->getMessage());
        }
    }

    public function createEmergencyRequest(array $requestData): bool
    {
        try {
            $sql = "INSERT INTO emergency_requests (emergency_id, hospital_id, blood_type, required_units, status) 
                    VALUES (:emergency_id, :hospital_id, :blood_type, :required_units, :status)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':emergency_id', $requestData['emergency_id']);
            $stmt->bindValue(':hospital_id', $requestData['hospital_id']);
            $stmt->bindValue(':blood_type', $requestData['blood_type']);
            $stmt->bindValue(':required_units', $requestData['required_units']);
            $stmt->bindValue(':status', $requestData['status']);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new HospitalException("Emergency request creation failed: " . $e->getMessage());
        }
    }

    public function updateEmergencyRequestStatus(string $emergencyId, string $status): bool
    {
        try {
            $sql = "UPDATE emergency_requests SET status = :status WHERE emergency_id = :emergency_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':emergency_id', $emergencyId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new HospitalException("Emergency request status update failed: " . $e->getMessage());
        }
    }

    public function getHospitalStats(string $hospitalId): array
    {
        try {
            // Get total emergency requests
            $sql1 = "SELECT COUNT(*) as total_requests FROM emergency_requests WHERE hospital_id = :hospital_id";
            $stmt1 = $this->conn->prepare($sql1);
            $stmt1->bindValue(':hospital_id', $hospitalId);
            $stmt1->execute();
            $totalRequests = $stmt1->fetchColumn();

            // Get pending requests
            $sql2 = "SELECT COUNT(*) as pending_requests FROM emergency_requests WHERE hospital_id = :hospital_id AND status = 'pending'";
            $stmt2 = $this->conn->prepare($sql2);
            $stmt2->bindValue(':hospital_id', $hospitalId);
            $stmt2->execute();
            $pendingRequests = $stmt2->fetchColumn();

            // Get total blood units available
            $sql3 = "SELECT SUM(units_available) as total_units FROM blood_inventory WHERE hospital_id = :hospital_id";
            $stmt3 = $this->conn->prepare($sql3);
            $stmt3->bindValue(':hospital_id', $hospitalId);
            $stmt3->execute();
            $totalUnits = $stmt3->fetchColumn();

            return [
                'total_requests' => (int)$totalRequests,
                'pending_requests' => (int)$pendingRequests,
                'total_blood_units' => (int)$totalUnits
            ];
        } catch (PDOException $e) {
            throw new HospitalException("Hospital stats retrieval failed: " . $e->getMessage());
        }
    }
}

class HospitalException extends Exception
{
    public function __construct($message = "", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
