<?php

require_once __DIR__ . '/Exceptions.php';

class User
{
    private $conn;
    private $table = 'users';

    public function __construct(PDO $dbConn)
    {
        $this->conn = $dbConn;
    }

    public function login(string $email, string $password): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE email = :email";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':email', $email);
            $stmt->execute();
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                if ($user['status'] === 'active') {
                    return [
                        'user_id' => $user['user_id'],
                        'name' => $user['name'],
                        'role' => $user['role'],
                        'email' => $user['email'],
                        'phone' => $user['phone'],
                        'status' => $user['status']
                    ];
                } else {
                    return ['pending' => true, 'status' => $user['status']];
                }
            }
            return false;
        } catch (PDOException $e) {
            throw new UserException("Login failed: " . $e->getMessage());
        }
    }

    public function createUser(array $userData): bool
    {
        try {
            $sql = "INSERT INTO {$this->table} (user_id, name, email, phone, password_hash, role, status) 
                    VALUES (:user_id, :name, :email, :phone, :password_hash, :role, :status)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':user_id', $userData['user_id']);
            $stmt->bindValue(':name', $userData['name']);
            $stmt->bindValue(':email', $userData['email']);
            $stmt->bindValue(':phone', $userData['phone']);
            $stmt->bindValue(':password_hash', $userData['password_hash']);
            $stmt->bindValue(':role', $userData['role']);
            $stmt->bindValue(':status', $userData['status']);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new UserException("User creation failed: " . $e->getMessage());
        }
    }

    public function updateUser(string $userId, array $userData): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET 
                    name = :name, 
                    email = :email, 
                    phone = :phone 
                    WHERE user_id = :user_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':name', $userData['name']);
            $stmt->bindValue(':email', $userData['email']);
            $stmt->bindValue(':phone', $userData['phone']);
            $stmt->bindValue(':user_id', $userId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new UserException("User update failed: " . $e->getMessage());
        }
    }

    public function getUserById(string $userId): array|false
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':user_id', $userId);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new UserException("User retrieval failed: " . $e->getMessage());
        }
    }

    public function isEmailRegistered(string $email): bool
    {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE email = :email";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':email', $email);
            $stmt->execute();

            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new UserException("Email check failed: " . $e->getMessage());
        }
    }

    public function updateStatus(string $userId, string $status): bool
    {
        try {
            $sql = "UPDATE {$this->table} SET status = :status WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':user_id', $userId);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new UserException("Status update failed: " . $e->getMessage());
        }
    }

    public function getAllUsers(): array
    {
        try {
            $sql = "SELECT user_id, name, email, phone, role, status FROM {$this->table} ORDER BY user_id DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new UserException("Users retrieval failed: " . $e->getMessage());
        }
    }

    public function getUsersByRole(string $role): array
    {
        try {
            $sql = "SELECT user_id, name, email, phone, status FROM {$this->table} WHERE role = :role ORDER BY user_id DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':role', $role);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new UserException("Users by role retrieval failed: " . $e->getMessage());
        }
    }
}
