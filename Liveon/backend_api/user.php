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
            return [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'], // Assuming you have a role field
            ];
        } else {
            return false;
        }
    }
}