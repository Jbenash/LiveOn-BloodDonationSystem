<?php

/**
 * Centralized Session Configuration
 * Fixes all session and cookie authentication issues
 */

// Prevent direct access
if (!defined('SESSION_CONFIG_LOADED')) {
    define('SESSION_CONFIG_LOADED', true);
}

// Configure session settings before session_start()
function configureSession()
{
    // Only configure if session is not already active
    if (session_status() === PHP_SESSION_NONE) {
        // Set secure session configuration for development
        ini_set('session.cookie_httponly', 0); // Allow JavaScript access for debugging
        ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
        ini_set('session.cookie_samesite', ''); // Empty for better cross-origin compatibility
        ini_set('session.cookie_lifetime', 0); // Session cookie
        ini_set('session.gc_maxlifetime', 7200); // 2 hour session timeout (increased from 1 hour)
        ini_set('session.use_strict_mode', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_path', '/');
        ini_set('session.cookie_domain', ''); // Empty for localhost compatibility

        // Set session name
        session_name('LIVEON_SESSION');
    }
}

// Initialize session with proper configuration
function initSession()
{
    configureSession();

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Regenerate session ID periodically for security (increased to 30 minutes)
    if (!isset($_SESSION['last_regeneration'])) {
        $_SESSION['last_regeneration'] = time();
    } elseif (time() - $_SESSION['last_regeneration'] > 1800) { // 30 minutes
        session_regenerate_id(true);
        $_SESSION['last_regeneration'] = time();
    }

    // Session cookie is automatically handled by PHP session_start()
    // Just ensure the cookie parameters are set correctly via ini_set above
}

// Set CORS headers consistently
function setCorsHeaders()
{
    $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:3000',
        'http://127.0.0.1'
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json");
}

// Handle preflight OPTIONS requests
function handlePreflight()
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

// Validate user session
function validateSession()
{
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - No valid session']);
        exit();
    }
}

// Check if user has specific role
function requireRole($requiredRole)
{
    validateSession();

    if ($_SESSION['role'] !== $requiredRole) {
        http_response_code(403);
        echo json_encode(['error' => "Forbidden - Requires $requiredRole role"]);
        exit();
    }
}

// Complete logout function
function performLogout()
{
    // Clear all session data
    $_SESSION = array();

    // Destroy the session
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }

    // Delete the session cookie with proper parameters
    if (isset($_COOKIE[session_name()])) {
        $cookieDeleted = setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        // If setcookie fails, try alternative approach
        if (!$cookieDeleted) {
            header('Set-Cookie: ' . session_name() . '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        }
    }

    // Clear any other cookies that might be set
    if (isset($_COOKIE['LIVEON_SESSION'])) {
        $liveonCookieDeleted = setcookie('LIVEON_SESSION', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        // If setcookie fails, try alternative approach
        if (!$liveonCookieDeleted) {
            header('Set-Cookie: LIVEON_SESSION=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        }
    }

    return ['success' => true, 'message' => 'Logged out successfully'];
}

// Get current user info
function getCurrentUser()
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    return [
        'user_id' => $_SESSION['user_id'],
        'role' => $_SESSION['role'],
        'name' => $_SESSION['name'] ?? '',
        'session_id' => session_id()
    ];
}

// Don't auto-initialize session - let each file handle it manually
// initSession();