<?php

namespace LiveOn\classes\Core;

use PDOException;
use PDO;

class Database
{
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $conn;
    private static $instance = null;

    private function __construct()
    {
        $this->host = 'localhost';
        $this->dbname = 'liveon_db';
        $this->username = 'root';
        $this->password = '';
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function connect()
    {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4";
                $this->conn = new PDO($dsn, $this->username, $this->password);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            } catch (PDOException $e) {
                throw new PDOException("Database connection failed: " . $e->getMessage());
            }
        }
        return $this->conn;
    }

    public function getConnection()
    {
        try {
            if ($this->conn === null || !$this->conn) {
                $this->connect();
            }
            // Test connection
            $this->conn->query('SELECT 1');
            return $this->conn;
        } catch (PDOException $e) {
            throw new PDOException("Connection test failed: " . $e->getMessage());
        }
        return $this->connect();
    }

    public function closeConnection()
    {
        $this->conn = null;
    }
}
