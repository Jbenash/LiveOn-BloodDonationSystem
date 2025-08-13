<?php

namespace LiveOn\Exceptions;

class DatabaseException extends \Exception {}
class ValidationException extends \Exception
{
    private array $errors;

    public function __construct(string $message, array $errors = [], int $code = 0)
    {
        parent::__construct($message, $code);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
class NotFoundException extends \Exception {}
class UnauthorizedException extends \Exception {}
class ForbiddenException extends \Exception {}
class InvalidRequestException extends \Exception {}
