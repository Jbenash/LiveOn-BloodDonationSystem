<?php
require_once __DIR__ . '/User.php';
require_once __DIR__ . '/Donor.php';
require_once __DIR__ . '/Hospital.php';
require_once __DIR__ . '/MedicalVerification.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/../services/DonorService.php';
require_once __DIR__ . '/../services/UserService.php';
require_once __DIR__ . '/../services/HospitalService.php';
require_once __DIR__ . '/../services/MedicalVerificationService.php';

class Container
{
    private $services = [];
    private $instances = [];

    public function register(string $name, callable $factory): void
    {
        $this->services[$name] = $factory;
    }

    public function get(string $name)
    {
        if (isset($this->instances[$name])) {
            return $this->instances[$name];
        }
        if (isset($this->services[$name])) {
            $instance = $this->services[$name]($this);
            $this->instances[$name] = $instance;
            return $instance;
        }
        throw new Exception("Service '$name' not found");
    }
}

// Global container instance
$container = new Container();

// Register core services
$container->register('database', function ($container) {
    $database = new Database();
    return $database->connect();
});

$container->register('validator', function ($container) {
    return new Validator();
});

$container->register('responseHandler', function ($container) {
    return new ResponseHandler();
});

// Register model classes
$container->register('userModel', function ($container) {
    return new User($container->get('database'));
});

$container->register('donorModel', function ($container) {
    return new Donor($container->get('database'));
});

$container->register('hospitalModel', function ($container) {
    return new Hospital($container->get('database'));
});

$container->register('medicalVerificationModel', function ($container) {
    return new MedicalVerification($container->get('database'));
});

// Register service classes
$container->register('donorService', function ($container) {
    return new DonorService(
        $container->get('database'),
        $container->get('validator')
    );
});

// Remove controller registrations for missing classes

// Helper function to get container instance
function app(): Container
{
    global $container;
    return $container;
}