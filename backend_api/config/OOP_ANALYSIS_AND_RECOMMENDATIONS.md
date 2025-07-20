# OOP Analysis and Recommendations for LiveOn Backend

## Current OOP Implementation Status

### ✅ **Good OOP Practices Found:**

1. **Database Class** (`db_connection.php`):

   - ✅ Proper encapsulation with private properties
   - ✅ Constructor and methods
   - ✅ Error handling with try-catch
   - ❌ Missing Singleton pattern
   - ❌ No configuration management

2. **User Class** (`user.php`):

   - ✅ Constructor dependency injection
   - ✅ Method encapsulation
   - ❌ Missing type hints
   - ❌ No custom exceptions

3. **Some Classes in `register_donor.php`**:

   - ✅ `Mailer` class for email functionality
   - ✅ `OTPManager` class for OTP handling
   - ✅ `DonorRegistration` class for registration logic
   - ❌ Mixed with procedural code

4. **HospitalDashboard Class** (`hospital_dashboard.php`):
   - ✅ Proper constructor with dependency injection
   - ✅ Method organization
   - ❌ No error handling
   - ❌ Direct SQL queries in class

### ❌ **Major Issues Found:**

1. **Inconsistent Database Connections**:

   - Many files use direct mysqli connections instead of the Database class
   - Mixed PDO and mysqli usage
   - No connection pooling

2. **Mixed Procedural and OOP Code**:

   - Files like `get_donor_registrations.php` are purely procedural
   - No separation of concerns
   - Business logic mixed with data access

3. **No Abstract Classes or Interfaces**:

   - Missing abstraction layers
   - No common interfaces for similar operations
   - No base classes for shared functionality

4. **No Error Handling Classes**:

   - Generic Exception usage
   - No custom exception hierarchy
   - Inconsistent error handling

5. **No Service Layer**:

   - Business logic mixed with data access
   - No separation between controllers and models
   - Direct database operations in API endpoints

6. **No Repository Pattern**:
   - Direct SQL queries in classes
   - No data access abstraction
   - Hard to test and maintain

## Recommended Improvements

### 1. **Database Layer Improvements**

**Current Issues:**

- Mixed PDO and mysqli usage
- No connection pooling
- No configuration management

**Recommendations:**

```php
// Use Singleton pattern with configuration
class Database
{
    private static $instance = null;
    private $config;
    private $connection;

    private function __construct()
    {
        $this->config = new DatabaseConfig();
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
}
```

### 2. **Create Abstract Base Classes**

```php
abstract class BaseModel
{
    protected $db;
    protected $table;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    abstract protected function getTableName(): string;

    protected function findById(string $id): ?array
    {
        // Common findById implementation
    }
}

abstract class BaseService
{
    protected $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    protected function validateData(array $data, array $rules): array
    {
        // Common validation logic
    }
}
```

### 3. **Implement Repository Pattern**

```php
interface UserRepositoryInterface
{
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): bool;
    public function delete(string $id): bool;
}

class UserRepository implements UserRepositoryInterface
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // Implementation methods
}
```

### 4. **Create Service Layer**

```php
class UserService
{
    private $userRepository;
    private $validator;

    public function __construct(UserRepositoryInterface $userRepository, Validator $validator)
    {
        $this->userRepository = $userRepository;
        $this->validator = $validator;
    }

    public function registerUser(array $userData): array
    {
        // Business logic here
        $validation = $this->validator->validate($userData, UserValidationRules::getRules());

        if (!$validation['valid']) {
            return ['success' => false, 'errors' => $validation['errors']];
        }

        $user = new User($userData);
        $saved = $this->userRepository->save($user);

        return ['success' => $saved];
    }
}
```

### 5. **Implement Custom Exception Hierarchy**

```php
abstract class LiveOnException extends Exception
{
    protected $context;

    public function __construct(string $message, array $context = [], int $code = 0)
    {
        parent::__construct($message, $code);
        $this->context = $context;
    }

    public function getContext(): array
    {
        return $this->context;
    }
}

class ValidationException extends LiveOnException {}
class DatabaseException extends LiveOnException {}
class AuthenticationException extends LiveOnException {}
```

### 6. **Create Controller Layer**

```php
class UserController
{
    private $userService;
    private $responseHandler;

    public function __construct(UserService $userService, ResponseHandler $responseHandler)
    {
        $this->userService = $userService;
        $this->responseHandler = $responseHandler;
    }

    public function register(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $this->userService->registerUser($data);
            $this->responseHandler->sendJson($result);
        } catch (ValidationException $e) {
            $this->responseHandler->sendError(400, $e->getMessage(), $e->getContext());
        } catch (Exception $e) {
            $this->responseHandler->sendError(500, 'Internal server error');
        }
    }
}
```

### 7. **Implement Dependency Injection Container**

```php
class Container
{
    private $services = [];

    public function register(string $name, callable $factory): void
    {
        $this->services[$name] = $factory;
    }

    public function get(string $name)
    {
        if (!isset($this->services[$name])) {
            throw new Exception("Service $name not found");
        }

        return $this->services[$name]($this);
    }
}

// Usage
$container = new Container();
$container->register('database', function() {
    return Database::getInstance();
});
$container->register('userRepository', function($container) {
    return new UserRepository($container->get('database'));
});
```

## Files That Need Immediate Refactoring

### High Priority:

1. `get_donor_registrations.php` - Convert to OOP
2. `save_medical_verification.php` - Extract business logic
3. `admin_dashboard.php` - Create service layer
4. `hospital_dashboard.php` - Improve error handling

### Medium Priority:

1. `update_donor_profile.php` - Use service layer
2. `user_login.php` - Improve structure
3. `register_donor.php` - Already improved version created

### Low Priority:

1. All other API endpoints - Standardize structure

## Implementation Plan

### Phase 1: Foundation (Week 1)

- [ ] Create abstract base classes
- [ ] Implement custom exception hierarchy
- [ ] Create dependency injection container
- [ ] Standardize database connection

### Phase 2: Core Classes (Week 2)

- [ ] Refactor User class with repository pattern
- [ ] Create Donor repository and service
- [ ] Create Hospital repository and service
- [ ] Create MedicalVerification repository and service

### Phase 3: Service Layer (Week 3)

- [ ] Implement UserService
- [ ] Implement DonorService
- [ ] Implement HospitalService
- [ ] Create validation classes

### Phase 4: Controllers (Week 4)

- [ ] Create UserController
- [ ] Create DonorController
- [ ] Create HospitalController
- [ ] Implement response handlers

### Phase 5: Testing & Documentation (Week 5)

- [ ] Write unit tests for all classes
- [ ] Create API documentation
- [ ] Performance testing
- [ ] Security audit

## Benefits of These Improvements

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to unit test individual components
3. **Scalability**: Easy to add new features
4. **Security**: Centralized validation and error handling
5. **Performance**: Better connection management
6. **Code Reusability**: Shared base classes and interfaces

## Code Quality Metrics to Track

1. **Cyclomatic Complexity**: Keep methods under 10
2. **Lines of Code**: Keep classes under 200 lines
3. **Test Coverage**: Aim for 80%+ coverage
4. **Dependency Injection**: Use DI for all external dependencies
5. **Exception Handling**: Custom exceptions for all error cases

This refactoring will transform your backend from a procedural approach to a modern, maintainable OOP architecture that follows SOLID principles and design patterns.
