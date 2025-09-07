<?php

require_once __DIR__ . '/../classes/Core/Exceptions.php';

use LiveOn\Exceptions\DatabaseException;
use LiveOn\Exceptions\ValidationException;

abstract class BaseService
{
    protected $pdo;
    protected $validator;

    public function __construct(PDO $pdo, Validator $validator = null)
    {
        $this->pdo = $pdo;
        $this->validator = $validator;
    }

    protected function validateData(array $data, array $rules): array
    {
        if (!$this->validator) {
            return ['valid' => true, 'errors' => []];
        }

        return $this->validator->validate($data, $rules);
    }

    protected function handleDatabaseException(DatabaseException $e): array
    {
        return [
            'success' => false,
            'message' => 'Database operation failed',
            'error' => $e->getMessage()
        ];
    }

    protected function handleValidationException(ValidationException $e): array
    {
        return [
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $e->getErrors()
        ];
    }

    protected function handleException(Exception $e): array
    {
        return [
            'success' => false,
            'message' => 'An error occurred',
            'error' => $e->getMessage()
        ];
    }

    protected function successResponse(array $data = [], string $message = 'Operation successful'): array
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];
    }

    protected function errorResponse(string $message, array $errors = []): array
    {
        return [
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ];
    }

    protected function requireTransaction(callable $operation): array
    {
        try {
            $this->pdo->beginTransaction();
            $result = $operation();
            $this->pdo->commit();
            return $result;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return $this->handleException($e);
        }
    }

    protected function sanitizeInput(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }

    protected function validateRequiredFields(array $data, array $requiredFields): array
    {
        $missingFields = [];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missingFields[] = $field;
            }
        }

        if (!empty($missingFields)) {
            return [
                'valid' => false,
                'errors' => ['Missing required fields: ' . implode(', ', $missingFields)]
            ];
        }

        return ['valid' => true, 'errors' => []];
    }

    protected function generateUniqueId(string $prefix): string
    {
        return $prefix . uniqid();
    }

    protected function formatDate(string $date): string
    {
        return date('Y-m-d H:i:s', strtotime($date));
    }

    protected function isEmailValid(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    protected function isPhoneValid(string $phone): bool
    {
        // Basic phone validation - can be customized
        return preg_match('/^[0-9+\-\s()]+$/', $phone);
    }
}
