<?php
class Database
{
    private $host = 'localhost';
    private $dbname = 'liveon_db';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function connect()
    {
        try {
            $dsn = "mysql:host=$this->host;dbname=$this->dbname;charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            return $this->conn;
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Database connection failed"]);
            exit();
        }
    }
}
