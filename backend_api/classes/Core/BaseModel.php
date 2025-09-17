<?php

require_once __DIR__ . '/Exceptions.php';

use LiveOn\Exceptions\DatabaseException;
use PDO;
use PDOException;

abstract class BaseModel
{
    protected $pdo;
    protected $table;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    abstract protected function getTableName(): string;

    protected function getPrimaryKey(): string
    {
        return 'id'; // Default primary key, can be overridden by child classes
    }

    protected function findById(string $id): ?array
    {
        try {
            $primaryKey = $this->getPrimaryKey();
            $sql = "SELECT * FROM {$this->getTableName()} WHERE {$primaryKey} = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to find record by ID: " . $e->getMessage());
        }
    }

    protected function findAll(array $conditions = [], array $orderBy = [], int $limit = null): array
    {
        try {
            $sql = "SELECT * FROM {$this->getTableName()}";
            $params = [];

            if (!empty($conditions)) {
                $whereClause = [];
                foreach ($conditions as $key => $value) {
                    $whereClause[] = "$key = :$key";
                    $params[$key] = $value;
                }
                $sql .= " WHERE " . implode(' AND ', $whereClause);
            }

            if (!empty($orderBy)) {
                $orderClause = [];
                foreach ($orderBy as $column => $direction) {
                    // Validate direction to prevent SQL injection
                    $direction = strtoupper($direction);
                    if (!in_array($direction, ['ASC', 'DESC'])) {
                        $direction = 'ASC';
                    }
                    $orderClause[] = "$column $direction";
                }
                $sql .= " ORDER BY " . implode(', ', $orderClause);
            }

            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to fetch records: " . $e->getMessage());
        }
    }

    protected function create(array $data): bool
    {
        try {
            $columns = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));

            $sql = "INSERT INTO {$this->getTableName()} ($columns) VALUES ($placeholders)";
            $stmt = $this->pdo->prepare($sql);

            return $stmt->execute($data);
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to create record: " . $e->getMessage());
        }
    }

    protected function update(string $id, array $data): bool
    {
        try {
            $setClause = [];
            foreach (array_keys($data) as $column) {
                $setClause[] = "$column = :$column";
            }

            $primaryKey = $this->getPrimaryKey();
            $sql = "UPDATE {$this->getTableName()} SET " . implode(', ', $setClause) . " WHERE {$primaryKey} = :primary_key_id";
            
            // Separate the parameters to avoid conflicts
            $params = $data;
            $params['primary_key_id'] = $id;

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to update record: " . $e->getMessage());
        }
    }

    protected function delete(string $id): bool
    {
        try {
            $primaryKey = $this->getPrimaryKey();
            $sql = "DELETE FROM {$this->getTableName()} WHERE {$primaryKey} = :id";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to delete record: " . $e->getMessage());
        }
    }

    protected function count(array $conditions = []): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()}";
            $params = [];

            if (!empty($conditions)) {
                $whereClause = [];
                foreach ($conditions as $key => $value) {
                    $whereClause[] = "$key = :$key";
                    $params[$key] = $value;
                }
                $sql .= " WHERE " . implode(' AND ', $whereClause);
            }

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new DatabaseException("Failed to count records: " . $e->getMessage());
        }
    }

    protected function beginTransaction(): void
    {
        $this->pdo->beginTransaction();
    }

    protected function commit(): void
    {
        $this->pdo->commit();
    }

    protected function rollback(): void
    {
        $this->pdo->rollBack();
    }
}