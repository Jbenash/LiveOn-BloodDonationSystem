<?php

/**
 * Script to fix CORS issues in all PHP controller files
 * This script updates files to use the new Database class and adds proper CORS headers
 */

$controllersDir = __DIR__ . '/controllers/';
$files = glob($controllersDir . '*.php');

$updatedFiles = [];
$errors = [];

foreach ($files as $file) {
    $filename = basename($file);
    $content = file_get_contents($file);
    $originalContent = $content;
    $updated = false;

    // Skip files that are already using the new Database class
    if (strpos($content, 'require_once __DIR__ . \'/../classes/Database.php\'') !== false) {
        continue;
    }

    // Add CORS headers if not present
    if (strpos($content, 'Access-Control-Allow-Origin') === false) {
        $corsHeaders = "// Allow requests from both development ports
\$allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
\$origin = \$_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array(\$origin, \$allowedOrigins)) {
    header(\"Access-Control-Allow-Origin: \$origin\");
}
header(\"Access-Control-Allow-Credentials: true\");
header(\"Access-Control-Allow-Headers: Content-Type\");
header(\"Access-Control-Allow-Methods: GET, POST, OPTIONS\");
";

        // Insert CORS headers after the opening PHP tag
        $content = preg_replace('/^<\?php\s*/', "<?php\n" . $corsHeaders . "\n", $content);
        $updated = true;
    }

    // Replace old database connection with new one
    if (strpos($content, 'require_once __DIR__ . \'/../config/db_connection.php\'') !== false) {
        $content = str_replace(
            'require_once __DIR__ . \'/../config/db_connection.php\';',
            'require_once __DIR__ . \'/../classes/Database.php\';',
            $content
        );
        $updated = true;
    }

    // Replace Database instantiation
    if (preg_match('/\$(\w+)\s*=\s*new\s+Database\(\);/', $content, $matches)) {
        $varName = $matches[1];
        $content = preg_replace(
            '/\$' . $varName . '\s*=\s*new\s+Database\(\);/',
            '$' . $varName . ' = Database::getInstance();',
            $content
        );
        $updated = true;
    }

    // Replace connect() method calls with getConnection()
    $content = preg_replace('/->connect\(\)/', '->getConnection()', $content);

    // Write the updated content back to the file
    if ($updated) {
        if (file_put_contents($file, $content)) {
            $updatedFiles[] = $filename;
        } else {
            $errors[] = "Failed to write to file: $filename";
        }
    }
}

echo "CORS Fix Script Results:\n";
echo "=======================\n\n";

if (!empty($updatedFiles)) {
    echo "Successfully updated " . count($updatedFiles) . " files:\n";
    foreach ($updatedFiles as $file) {
        echo "- $file\n";
    }
    echo "\n";
} else {
    echo "No files needed updating.\n\n";
}

if (!empty($errors)) {
    echo "Errors encountered:\n";
    foreach ($errors as $error) {
        echo "- $error\n";
    }
    echo "\n";
}

echo "Script completed.\n";
