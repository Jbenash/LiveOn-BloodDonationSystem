<?php

namespace LiveOn\classes\Core;

use Exception;
use PDOException;
use LiveOnException;
use ValidationException;

class ResponseHandler
{
    public function sendJson(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public function sendSuccess(array $data = [], string $message = 'Success', int $statusCode = 200): void
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];
        $this->sendJson($response, $statusCode);
    }

    public function sendError(int $statusCode, string $message, array $errors = []): void
    {
        $response = [
            'success' => false,
            'message' => $message
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        $this->sendJson($response, $statusCode);
    }

    public function sendValidationError(array $errors): void
    {
        $this->sendError(422, 'Validation failed', $errors);
    }

    public function sendNotFound(string $message = 'Resource not found'): void
    {
        $this->sendError(404, $message);
    }

    public function sendUnauthorized(string $message = 'Authentication required'): void
    {
        $this->sendError(401, $message);
    }

    public function sendForbidden(string $message = 'Access denied'): void
    {
        $this->sendError(403, $message);
    }

    public function sendMethodNotAllowed(string $message = 'Method not allowed'): void
    {
        $this->sendError(405, $message);
    }

    public function sendInternalError(string $message = 'Internal server error'): void
    {
        $this->sendError(500, $message);
    }

    public function handleException(Exception $e): void
    {
        if ($e instanceof LiveOnException) {
            $this->sendError($e->getCode(), $e->getMessage(), $e->getContext());
        } elseif ($e instanceof ValidationException) {
            $this->sendValidationError($e->getErrors());
        } elseif ($e instanceof PDOException) {
            $this->sendInternalError('Database operation failed');
        } else {
            $this->sendInternalError('An unexpected error occurred');
        }
    }
}
