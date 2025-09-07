<?php
// Email Configuration with Multiple Options
class EmailConfig
{

    // Email mode: 'smtp', 'local', 'disabled', 'log_only'
    public static $EMAIL_MODE = 'log_only'; // Changed to log_only for now due to SMTP issues

    // SMTP Configuration
    public static $SMTP_CONFIG = [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'liveonsystem@gmail.com',
        'password' => 'jzjcyywthodnlrew',
        'encryption' => 'tls',
        'timeout' => 10
    ];

    // Alternative SMTP (if needed)
    public static $SMTP_ALTERNATIVE = [
        'host' => 'smtp.gmail.com',
        'port' => 465,
        'username' => 'liveonsystem@gmail.com',
        'password' => 'jzjcyywthodnlrew',
        'encryption' => 'ssl',
        'timeout' => 10
    ];

    // From address
    public static $FROM_EMAIL = 'liveonsystem@gmail.com';
    public static $FROM_NAME = 'LiveOn System';

    // Email templates directory
    public static $TEMPLATES_DIR = __DIR__ . '/../templates/email/';

    // Log directory
    public static $LOG_DIR = __DIR__ . '/../logs/';

    // Fallback notification settings
    public static $FALLBACK_ENABLED = true;
    public static $ADMIN_NOTIFICATION = true;
}
