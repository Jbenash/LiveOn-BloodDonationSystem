# OOP Implementation Plan for LiveOn Backend

## 🎯 **Current Status**

### ✅ **Completed:**

- PDO database connections
- Centralized `db_connection.php`
- Basic error handling
- Some existing classes (Database, User, HospitalDashboard)

### 🚧 **In Progress:**

- Abstract base classes created
- Service layer foundation
- Validation system
- Controller layer foundation
- Dependency injection container

## 📋 **Implementation Roadmap**

### **Phase 1: Foundation Classes (Week 1)**

#### 1.1 **Update Existing Classes**

- [ ] Update `User.php` to extend `BaseModel`
- [ ] Update `Donor.php` to extend `BaseModel`
- [ ] Update `Hospital.php` to extend `BaseModel`
- [ ] Update `MedicalVerification.php` to extend `BaseModel`

#### 1.2 **Create Service Classes**

- [ ] Create `UserService.php` extending `BaseService`
- [ ] Create `DonorService.php` extending `BaseService`
- [ ] Create `HospitalService.php` extending `BaseService`
- [ ] Create `MedicalVerificationService.php` extending `BaseService`

#### 1.3 **Create Controller Classes**

- [ ] Create `UserController.php` extending `BaseController`
- [ ] Create `DonorController.php` extending `BaseController`
- [ ] Create `HospitalController.php` extending `BaseController`
- [ ] Create `MedicalVerificationController.php` extending `BaseController`

### **Phase 2: Refactor Existing Files (Week 2)**

#### 2.1 **Convert API Endpoints**

- [ ] Refactor `user_login.php` to use `UserController`
- [ ] Refactor `register_donor.php` to use `DonorController`
- [ ] Refactor `save_medical_verification.php` to use `MedicalVerificationController`
- [ ] Refactor `update_donor_profile.php` to use `DonorController`
- [ ] Refactor `admin_dashboard.php` to use `UserController`
- [ ] Refactor `hospital_dashboard.php` to use `HospitalController`

#### 2.2 **Create Repository Pattern**

- [ ] Create `UserRepository.php`
- [ ] Create `DonorRepository.php`
- [ ] Create `HospitalRepository.php`
- [ ] Create `MedicalVerificationRepository.php`

### **Phase 3: Advanced OOP Features (Week 3)**

#### 3.1 **Implement Interfaces**

- [ ] Create `UserRepositoryInterface.php`
- [ ] Create `DonorRepositoryInterface.php`
- [ ] Create `HospitalRepositoryInterface.php`
- [ ] Create `MedicalVerificationRepositoryInterface.php`

#### 3.2 **Create Value Objects**

- [ ] Create `Email.php` value object
- [ ] Create `Phone.php` value object
- [ ] Create `BloodType.php` value object
- [ ] Create `Age.php` value object

#### 3.3 **Implement Event System**

- [ ] Create `EventDispatcher.php`
- [ ] Create `UserRegisteredEvent.php`
- [ ] Create `DonorVerifiedEvent.php`
- [ ] Create `DonationCompletedEvent.php`

### **Phase 4: Testing & Documentation (Week 4)**

#### 4.1 **Unit Tests**

- [ ] Create tests for all model classes
- [ ] Create tests for all service classes
- [ ] Create tests for all controller classes
- [ ] Create tests for validation classes

#### 4.2 **API Documentation**

- [ ] Create OpenAPI/Swagger documentation
- [ ] Document all endpoints
- [ ] Create usage examples

## 🏗️ **Architecture Overview**

```
backend_api/
├── classes/
│   ├── BaseModel.php          ✅ Created
│   ├── BaseService.php        ✅ Created
│   ├── BaseController.php     ✅ Created
│   ├── Validator.php          ✅ Created
│   ├── Container.php          ✅ Created
│   ├── User.php               🔄 Update needed
│   ├── Donor.php              🔄 Update needed
│   ├── Hospital.php           🔄 Update needed
│   └── MedicalVerification.php 🔄 Update needed
├── services/
│   ├── UserService.php        📝 To create
│   ├── DonorService.php       📝 To create
│   ├── HospitalService.php    📝 To create
│   └── MedicalVerificationService.php 📝 To create
├── controllers/
│   ├── UserController.php     📝 To create
│   ├── DonorController.php    📝 To create
│   ├── HospitalController.php 📝 To create
│   └── MedicalVerificationController.php 📝 To create
├── repositories/
│   ├── UserRepository.php     📝 To create
│   ├── DonorRepository.php    📝 To create
│   ├── HospitalRepository.php 📝 To create
│   └── MedicalVerificationRepository.php 📝 To create
├── interfaces/
│   ├── UserRepositoryInterface.php 📝 To create
│   ├── DonorRepositoryInterface.php 📝 To create
│   ├── HospitalRepositoryInterface.php 📝 To create
│   └── MedicalVerificationRepositoryInterface.php 📝 To create
├── value_objects/
│   ├── Email.php              📝 To create
│   ├── Phone.php              📝 To create
│   ├── BloodType.php          📝 To create
│   └── Age.php                📝 To create
├── events/
│   ├── EventDispatcher.php    📝 To create
│   ├── UserRegisteredEvent.php 📝 To create
│   ├── DonorVerifiedEvent.php 📝 To create
│   └── DonationCompletedEvent.php 📝 To create
└── tests/
    ├── models/                📝 To create
    ├── services/              📝 To create
    └── controllers/           📝 To create
```

## 🎯 **OOP Principles Implementation**

### **1. Encapsulation**

- ✅ Private properties with public getters/setters
- ✅ Protected methods for internal operations
- ✅ Public methods for external API

### **2. Inheritance**

- ✅ Abstract base classes for common functionality
- ✅ Model classes extending `BaseModel`
- ✅ Service classes extending `BaseService`
- ✅ Controller classes extending `BaseController`

### **3. Polymorphism**

- ✅ Interface implementations
- ✅ Method overriding in child classes
- ✅ Dependency injection with interfaces

### **4. Abstraction**

- ✅ Abstract base classes
- ✅ Interface definitions
- ✅ Service layer abstraction

## 🔧 **Design Patterns Used**

### **1. Repository Pattern**

```php
interface UserRepositoryInterface {
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): bool;
    public function delete(string $id): bool;
}
```

### **2. Service Layer Pattern**

```php
class UserService extends BaseService {
    public function registerUser(array $data): array {
        // Business logic here
    }
}
```

### **3. Dependency Injection Pattern**

```php
class UserController extends BaseController {
    public function __construct(UserService $userService, ResponseHandler $responseHandler) {
        parent::__construct($userService, $responseHandler);
    }
}
```

### **4. Factory Pattern**

```php
class Container {
    public function register(string $name, callable $factory): void {
        $this->services[$name] = $factory;
    }
}
```

## 📊 **Benefits of This Implementation**

### **1. Maintainability**

- Clear separation of concerns
- Easy to modify individual components
- Consistent code structure

### **2. Testability**

- Each class can be unit tested independently
- Mock dependencies easily
- Clear interfaces for testing

### **3. Scalability**

- Easy to add new features
- Modular architecture
- Reusable components

### **4. Security**

- Centralized validation
- Input sanitization
- Proper error handling

### **5. Performance**

- Connection pooling
- Efficient database queries
- Cached service instances

## 🚀 **Next Steps**

### **Immediate Actions:**

1. **Update existing model classes** to extend `BaseModel`
2. **Create service classes** for business logic
3. **Create controller classes** for HTTP handling
4. **Refactor existing API endpoints** to use new structure

### **Short-term Goals:**

1. **Implement repository pattern** for data access
2. **Add comprehensive validation** for all inputs
3. **Create value objects** for domain entities
4. **Add event system** for important actions

### **Long-term Goals:**

1. **Complete unit test coverage**
2. **API documentation** with OpenAPI
3. **Performance optimization**
4. **Security audit** and improvements

## 📝 **Example Implementation**

### **Before (Procedural):**

```php
// user_login.php
$conn = new mysqli($host, $user, $pass, $db);
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->fetch_assoc();
```

### **After (OOP):**

```php
// UserController.php
public function login(): void {
    $this->handleRequest(function() {
        $data = $this->getRequestData();
        $this->validateRequest($data, UserValidationRules::getLoginRules());

        $result = $this->service->login($data['email'], $data['password']);
        return $this->responseHandler->sendSuccess($result);
    });
}
```

This implementation will transform your backend into a modern, maintainable, and scalable OOP architecture! 🎉
