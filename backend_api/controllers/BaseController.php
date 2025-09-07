<?php

require_once __DIR__ . '/../classes/Core/Exceptions.php';
require_once __DIR__ . '/../classes/Core/Validator.php';
require_once __DIR__ . '/../classes/Core/ResponseHandler.php';

use LiveOn\Exceptions\DatabaseException;
use LiveOn\Exceptions\ValidationException;
use LiveOn\Exceptions\NotFoundException;
use LiveOn\Exceptions\UnauthorizedException;
use LiveOn\Exceptions\ForbiddenException;
use LiveOn\Exceptions\InvalidRequestException;
use LiveOn\Exceptions\MethodNotAllowedException;

abstract class BaseController
{
    protected $service;
    protected $responseHandler;

    public function __construct($service, \LiveOn\classes\Core\ResponseHandler $responseHandler)
    {
        $this->service = $service;
        $this->responseHandler = $responseHandler;
    }

    protected function getRequestData(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidRequestException('Invalid JSON data');
        }

        return $data ?: [];
    }

    protected function getQueryParams(): array
    {
        return $_GET;
    }

    protected function getPostData(): array
    {
        return $_POST;
    }

    protected function getFileData(): array
    {
        return $_FILES;
    }

    protected function requireMethod(string $method): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
            throw new MethodNotAllowedException("Method {$_SERVER['REQUEST_METHOD']} not allowed");
        }
    }

    protected function requireAuth(): void
    {
        if (!isset($_SESSION['user_id'])) {
            throw new UnauthorizedException('Authentication required');
        }
    }

    protected function requireRole(string $role): void
    {
        $this->requireAuth();

        if (!isset($_SESSION['role'])) {
            throw new ForbiddenException("No role found in session");
        }

        if ($_SESSION['role'] !== $role) {
            throw new ForbiddenException("Access denied. Required role: $role, but user has role: " . $_SESSION['role']);
        }
    }

    protected function requireAnyRole(array $roles): void
    {
        $this->requireAuth();

        if (!in_array($_SESSION['role'], $roles)) {
            throw new ForbiddenException("Access denied. Required roles: " . implode(', ', $roles));
        }
    }

    protected function getCurrentUserId(): string
    {
        $this->requireAuth();
        return $_SESSION['user_id'];
    }

    protected function getCurrentUserRole(): string
    {
        $this->requireAuth();
        return $_SESSION['role'];
    }

    protected function handleRequest(callable $operation): void
    {
        try {
            $result = $operation();
            $this->responseHandler->sendJson($result);
        } catch (ValidationException $e) {
            $this->responseHandler->sendError(400, $e->getMessage(), $e->getErrors());
        } catch (UnauthorizedException $e) {
            $this->responseHandler->sendError(401, $e->getMessage());
        } catch (ForbiddenException $e) {
            $this->responseHandler->sendError(403, $e->getMessage());
        } catch (NotFoundException $e) {
            $this->responseHandler->sendError(404, $e->getMessage());
        } catch (MethodNotAllowedException $e) {
            $this->responseHandler->sendError(405, $e->getMessage());
        } catch (InvalidRequestException $e) {
            $this->responseHandler->sendError(400, $e->getMessage());
        } catch (DatabaseException $e) {
            $this->responseHandler->sendError(500, 'Database error: ' . $e->getMessage());
        } catch (Exception $e) {
            $this->responseHandler->sendError(500, 'Internal server error');
        }
    }

    protected function validateRequest(array $data, array $rules): array
    {
        $validator = new Validator();
        $result = $validator->validate($data, $rules);

        if (!$result['valid']) {
            throw new ValidationException('Validation failed', $result['errors']);
        }

        return $data;
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

    protected function setCorsHeaders(): void
    {
        $allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
