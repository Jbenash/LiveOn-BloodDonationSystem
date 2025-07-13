<?php
class User
{
    private $conn;
    private $table = 'users';

    public function __construct($dbConn)
    {
        $this->conn = $dbConn;
    }

    public function login($email, $password)
    {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email ";
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
                ];
            } else {
                // Return a special value for pending/inactive status
                return ['pending' => true, 'status' => $user['status']];
            }
        } else {
            return false;
        }
    }
}
