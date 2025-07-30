# LiveOn OOP Structure Guide

## Overview

This guide explains the Object-Oriented Programming (OOP) structure implemented in the LiveOn backend API. The structure follows SOLID principles and modern PHP best practices.

## Architecture Overview

```
backend_api/
├── classes/                    # Core classes and utilities
│   ├── Database.php           # Singleton database connection
│   ├── Exceptions.php         # Custom exception hierarchy
│   ├── ResponseHandler.php    # HTTP response handling
│   ├── BaseModel.php          # Abstract base model
│   ├── BaseController.php     # Abstract base controller
│   ├── Validator.php          # Input validation
│   ├── Container.php          # Dependency injection container
│   ├── User.php               # User model
│   ├── Donor.php              # Donor model
│   ├── Hospital.php           # Hospital model
│   └── MedicalVerification.php # Medical verification model
├── services/                   # Business logic layer
│   ├── BaseService.php        # Abstract base service
│   ├── UserService.php        # User business logic
│   ├── DonorService.php       # Donor business logic
│   ├── HospitalService.php    # Hospital business logic
│   └── MedicalVerificationService.php # Medical verification logic
├── controllers/                # HTTP request handling
│   ├── AdminController.php    # Admin dashboard controller
│   ├── UserController.php     # User management controller
│   ├── DonorController.php    # Donor management controller
│   └── HospitalController.php # Hospital management controller
└── config/                     # Configuration files
    └── db_connection.php       # Legacy database connection (deprecated)
```

## Core Classes

### 1. Database Class (Singleton Pattern)

**Location**: `classes/Database.php`

**Purpose**: Manages database connections using the Singleton pattern to ensure only one connection instance exists.

**Usage**:

```php
// Get database instance
$database = Database::getInstance();
$pdo = $database->connect();

// Use PDO for database operations
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
```

**Features**:

- Singleton pattern prevents multiple connections
- PDO with error handling
- Connection pooling
- Automatic error handling

### 2. Exception Hierarchy

**Location**: `classes/Exceptions.php`

**Purpose**: Provides custom exceptions for different error scenarios.

**Available Exceptions**:

- `LiveOnException` - Base exception class
- `InvalidRequestException` - Invalid request data (400)
- `MethodNotAllowedException` - Wrong HTTP method (405)
- `UnauthorizedException` - Authentication required (401)
- `ForbiddenException` - Access denied (403)
- `NotFoundException` - Resource not found (404)
- `ValidationException` - Validation failed (422)
- `DatabaseException` - Database errors (500)
- `UserException` - User operation errors (500)

**Usage**:

```php
// Throw custom exceptions
throw new ValidationException('Email is required', ['email' => 'required']);

// Handle exceptions
try {
    // Some operation
} catch (ValidationException $e) {
    $this->responseHandler->sendValidationError($e->getErrors());
}
```

### 3. ResponseHandler Class

**Location**: `classes/ResponseHandler.php`

**Purpose**: Handles HTTP responses in a consistent way across the application.

**Methods**:

- `sendJson($data, $statusCode)` - Send JSON response
- `sendSuccess($data, $message, $statusCode)` - Send success response
- `sendError($statusCode, $message, $errors)` - Send error response
- `sendValidationError($errors)` - Send validation error
- `sendNotFound($message)` - Send 404 response
- `sendUnauthorized($message)` - Send 401 response
- `sendForbidden($message)` - Send 403 response
- `handleException($exception)` - Handle any exception

**Usage**:

```php
$responseHandler = new ResponseHandler();

// Success response
$responseHandler->sendSuccess($data, 'User created successfully');

// Error response
$responseHandler->sendError(400, 'Invalid input', $errors);

// Handle exceptions
try {
    // Some operation
} catch (Exception $e) {
    $responseHandler->handleException($e);
}
```

### 4. BaseModel Class

**Location**: `classes/BaseModel.php`

**Purpose**: Abstract base class for all model classes, providing common database operations.

**Features**:

- CRUD operations (Create, Read, Update, Delete)
- Transaction support
- Error handling
- Prepared statements

**Usage**:

```php
class UserModel extends BaseModel
{
    protected function getTableName(): string
    {
        return 'users';
    }

    public function findByEmail(string $email): ?array
    {
        $conditions = ['email' => $email];
        $results = $this->findAll($conditions);
        return $results[0] ?? null;
    }
}
```

### 5. BaseService Class

**Location**: `services/BaseService.php`

**Purpose**: Abstract base class for all service classes, providing business logic foundation.

**Features**:

- Data validation
- Error handling
- Response formatting
- Database transaction support

**Usage**:

```php
class UserService extends BaseService
{
    public function createUser(array $userData): array
    {
        try {
            // Validate data
            $validation = $this->validateData($userData, UserValidationRules::getRules());
            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Business logic here
            $result = $this->userModel->create($userData);

            return $this->successResponse($result, 'User created successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }
}
```

### 6. BaseController Class

**Location**: `controllers/BaseController.php`

**Purpose**: Abstract base class for all controller classes, providing HTTP request handling foundation.

**Features**:

- Request data extraction
- Authentication checks
- Role-based access control
- Method validation

**Usage**:

```php
class UserController extends BaseController
{
    public function create(): void
    {
        try {
            $this->requireMethod('POST');
            $this->requireRole('admin');

            $data = $this->getRequestData();
            $result = $this->service->createUser($data);

            $this->responseHandler->sendSuccess($result);
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }
}
```

## How to Use the OOP Structure

### 1. Creating a New Controller

```php
<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../classes/ResponseHandler.php';
require_once __DIR__ . '/../classes/Database.php';

class ExampleController extends BaseController
{
    private $pdo;

    public function __construct()
    {
        $database = Database::getInstance();
        $this->pdo = $database->connect();
        $responseHandler = new ResponseHandler();
        parent::__construct(null, $responseHandler);
    }

    public function getData(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAuth();

            // Your logic here
            $data = ['message' => 'Hello World'];

            $this->responseHandler->sendSuccess($data);
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }
}
```

### 2. Creating a New Service

```php
<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../classes/Validator.php';

class ExampleService extends BaseService
{
    public function processData(array $data): array
    {
        try {
            // Validate input
            $validation = $this->validateData($data, [
                'name' => ['required', 'min:3'],
                'email' => ['required', 'email']
            ]);

            if (!$validation['valid']) {
                return $this->errorResponse('Validation failed', $validation['errors']);
            }

            // Business logic here
            $result = $this->processBusinessLogic($data);

            return $this->successResponse($result, 'Data processed successfully');
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    private function processBusinessLogic(array $data): array
    {
        // Your business logic here
        return ['processed' => true, 'data' => $data];
    }
}
```

### 3. Creating a New Model

```php
<?php
require_once __DIR__ . '/BaseModel.php';

class ExampleModel extends BaseModel
{
    protected function getTableName(): string
    {
        return 'example_table';
    }

    public function findActive(): array
    {
        return $this->findAll(['status' => 'active']);
    }

    public function findByName(string $name): ?array
    {
        $conditions = ['name' => $name];
        $results = $this->findAll($conditions);
        return $results[0] ?? null;
    }
}
```

## Best Practices

### 1. Error Handling

Always use try-catch blocks and throw appropriate exceptions:

```php
try {
    // Your code here
} catch (ValidationException $e) {
    $this->responseHandler->sendValidationError($e->getErrors());
} catch (DatabaseException $e) {
    $this->responseHandler->sendInternalError('Database operation failed');
} catch (Exception $e) {
    $this->responseHandler->handleException($e);
}
```

### 2. Input Validation

Always validate input data:

```php
$validation = $this->validateData($data, [
    'email' => ['required', 'email'],
    'password' => ['required', 'min:8'],
    'age' => ['required', 'numeric', 'min:18']
]);
```

### 3. Authentication and Authorization

Use the built-in methods for access control:

```php
$this->requireAuth();           // Check if user is logged in
$this->requireRole('admin');    // Check specific role
$this->requireAnyRole(['admin', 'moderator']); // Check multiple roles
```

### 4. Database Operations

Use the BaseModel methods for database operations:

```php
// Find by ID
$user = $this->findById($userId);

// Find with conditions
$users = $this->findAll(['status' => 'active']);

// Create new record
$success = $this->create($userData);

// Update record
$success = $this->update($userId, $updateData);

// Delete record
$success = $this->delete($userId);
```

## Testing the OOP Structure

Run the test file to verify everything is working:

```bash
php backend_api/test_oop_structure.php
```

This will check:

- All required files exist
- Database Singleton works correctly
- All exception classes are available
- ResponseHandler methods exist
- Base classes are properly defined
- AdminController is working
- MedicalVerification classes are working

## Migration from Procedural Code

To migrate existing procedural code to OOP:

1. **Identify the functionality** in your procedural file
2. **Create a Controller** that extends BaseController
3. **Create a Service** that extends BaseService for business logic
4. **Create a Model** that extends BaseModel for data access
5. **Update the original file** to use the new Controller

Example migration:

**Before (Procedural)**:

```php
// user_login.php
$conn = new mysqli($host, $user, $pass, $db);
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->fetch_assoc();
```

**After (OOP)**:

```php
// UserController.php
public function login(): void
{
    try {
        $this->requireMethod('POST');
        $data = $this->getRequestData();
        $result = $this->userService->login($data['email'], $data['password']);
        $this->responseHandler->sendSuccess($result);
    } catch (Exception $e) {
        $this->responseHandler->handleException($e);
    }
}

// user_login.php (updated)
require_once __DIR__ . '/UserController.php';
$controller = new UserController();
$controller->login();
```

## Benefits of This OOP Structure

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to unit test individual components
3. **Reusability**: Shared base classes and utilities
4. **Security**: Centralized validation and error handling
5. **Consistency**: Standardized response format
6. **Scalability**: Easy to add new features
7. **Error Handling**: Comprehensive exception handling
8. **Documentation**: Self-documenting code structure

This OOP structure provides a solid foundation for building maintainable and scalable PHP applications while following modern best practices.
