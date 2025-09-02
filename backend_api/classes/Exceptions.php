<?php

/**
 * Base exception class for LiveOn application
 */
abstract class LiveOnException extends Exception
{
    protected $context;

    public function __construct(string $message, array $context = [], int $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }

    public function getContext(): array
    {
        return $this->context;
    }
}

/**
 * Exception thrown when request data is invalid
 */
class InvalidRequestException extends LiveOnException
{
    public function __construct(string $message = 'Invalid request data', array $context = [])
    {
        parent::__construct($message, $context, 400);
    }
}

/**
 * Exception thrown when HTTP method is not allowed
 */
class MethodNotAllowedException extends LiveOnException
{
    public function __construct(string $message = 'Method not allowed', array $context = [])
    {
        parent::__construct($message, $context, 405);
    }
}

/**
 * Exception thrown when user is not authenticated
 */
class UnauthorizedException extends LiveOnException
{
    public function __construct(string $message = 'Authentication required', array $context = [])
    {
        parent::__construct($message, $context, 401);
    }
}

/**
 * Exception thrown when user doesn't have required permissions
 */
class ForbiddenException extends LiveOnException
{
    public function __construct(string $message = 'Access denied', array $context = [])
    {
        parent::__construct($message, $context, 403);
    }
}

/**
 * Exception thrown when a resource is not found
 */
class NotFoundException extends LiveOnException
{
    public function __construct(string $message = 'Resource not found', array $context = [])
    {
        parent::__construct($message, $context, 404);
    }
}

/**
 * Exception thrown when validation fails
 */
class ValidationException extends LiveOnException
{
    private $errors;

    public function __construct(string $message = 'Validation failed', array $errors = [], array $context = [])
    {
        parent::__construct($message, $context, 422);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}

/**
 * Exception thrown when database operations fail
 */
class DatabaseException extends LiveOnException
{
    public function __construct(string $message = 'Database operation failed', array $context = [])
    {
        parent::__construct($message, $context, 500);
    }
}

/**
 * Exception thrown when user operations fail
 */
class UserException extends LiveOnException
{
    public function __construct(string $message = 'User operation failed', array $context = [])
    {
        parent::__construct($message, $context, 500);
    }
}