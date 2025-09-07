<?php
// Enhanced EmailService with better error handling and debugging
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EnhancedEmailService extends BaseService
{
    private $mailer;
    private $debugMode;

    public function __construct(PDO $pdo, Validator $validator = null, bool $debugMode = false)
    {
        parent::__construct($pdo, $validator);
        $this->debugMode = $debugMode;
        $this->initializeMailer();
    }

    private function initializeMailer(): void
    {
        try {
            $this->mailer = new PHPMailer(true);
            $this->mailer->isSMTP();
            $this->mailer->Host = 'smtp.gmail.com';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = 'liveonsystem@gmail.com';
            $this->mailer->Password = 'jzjcyywthodnlrew';
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = 587;
            $this->mailer->isHTML(true);
            $this->mailer->setFrom('liveonsystem@gmail.com', 'LiveOn System');

            // Enhanced settings for better reliability
            $this->mailer->Timeout = 60;
            $this->mailer->SMTPKeepAlive = true;
            $this->mailer->CharSet = 'UTF-8';

            if ($this->debugMode) {
                $this->mailer->SMTPDebug = 2;
                $this->mailer->Debugoutput = function ($str, $level) {
                    error_log("PHPMailer DEBUG $level: $str");
                };
            }
        } catch (Exception $e) {
            error_log("Email service initialization failed: " . $e->getMessage());
            throw new Exception("Email service initialization failed: " . $e->getMessage());
        }
    }

    public function sendPasswordChangeConfirmation(string $toEmail, string $toName): array
    {
        try {
            // Validate email
            if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Invalid email address');
            }

            // Validate name
            if (empty(trim($toName))) {
                return $this->errorResponse('Recipient name is required');
            }

            // Clear any previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            $this->mailer->clearReplyTos();

            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Password Changed Successfully - LiveOn';
            $this->mailer->Body = $this->generatePasswordChangeTemplate($toName);
            $this->mailer->AltBody = $this->generatePasswordChangeTextTemplate($toName);

            // Log attempt
            error_log("Attempting to send password change email to: $toEmail");

            // Test SMTP connection first
            if (!$this->testSMTPConnection()) {
                return $this->errorResponse('SMTP connection failed');
            }

            // Send the email
            $result = $this->mailer->send();

            if ($result) {
                error_log("Password change email sent successfully to: $toEmail");
                return $this->successResponse(
                    ['email' => $toEmail],
                    'Password change confirmation email sent successfully'
                );
            } else {
                error_log("Failed to send password change email to: $toEmail");
                return $this->errorResponse('Failed to send email - unknown error');
            }
        } catch (Exception $e) {
            error_log("Password change email error: " . $e->getMessage());
            error_log("Error details: " . $e->getTraceAsString());

            // Provide more specific error messages based on the exception
            $errorMessage = $this->parseEmailError($e->getMessage());
            return $this->errorResponse('Password change confirmation email could not be sent: ' . $errorMessage);
        }
    }

    private function testSMTPConnection(): bool
    {
        try {
            // Test connection without sending
            $connected = $this->mailer->smtpConnect();
            if ($connected) {
                $this->mailer->smtpClose();
                return true;
            }
            return false;
        } catch (Exception $e) {
            error_log("SMTP connection test failed: " . $e->getMessage());
            return false;
        }
    }

    private function parseEmailError(string $errorMessage): string
    {
        if (strpos($errorMessage, 'Username and Password not accepted') !== false) {
            return 'Gmail authentication failed - please check app password';
        } elseif (strpos($errorMessage, 'Connection timed out') !== false) {
            return 'Connection timeout - please check network and firewall settings';
        } elseif (strpos($errorMessage, 'Could not connect to SMTP host') !== false) {
            return 'Cannot connect to Gmail SMTP server - please check internet connection';
        } elseif (strpos($errorMessage, 'SSL/TLS') !== false) {
            return 'SSL/TLS connection issue - please check OpenSSL configuration';
        } else {
            return $errorMessage;
        }
    }

    private function generatePasswordChangeTemplate(string $name): string
    {
        $currentDate = date('F j, Y \a\t g:i A');

        return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;'>
            <div style='background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                <div style='text-align: center; margin-bottom: 30px;'>
                    <h1 style='color: #dc2626; margin: 0; font-size: 28px;'>LiveOn</h1>
                    <p style='color: #666; margin: 5px 0 0 0; font-size: 16px;'>Blood Donation Management System</p>
                </div>
                
                <h2 style='color: #333; margin-bottom: 20px; text-align: center;'>Password Changed Successfully</h2>
                
                <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>
                    Dear <strong>{$name}</strong>,
                </p>
                
                <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>
                    This email is to confirm that your account password has been successfully changed by an administrator on <strong>{$currentDate}</strong>.
                </p>
                
                <div style='background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;'>
                    <p style='color: #1e40af; margin: 0; font-weight: bold;'>
                        🔒 Security Notice
                    </p>
                    <p style='color: #1e40af; margin: 10px 0 0 0; font-size: 14px;'>
                        If you did not request this password change, please contact our support team immediately.
                    </p>
                </div>
                
                <p style='color: #333; line-height: 1.6; margin-bottom: 20px;'>
                    You can now log in to your account using your new password. For security purposes, we recommend:
                </p>
                
                <ul style='color: #333; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;'>
                    <li>Keep your password confidential</li>
                    <li>Use a strong, unique password</li>
                    <li>Log out from shared devices</li>
                </ul>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='color: #999; font-size: 14px; margin: 0;'>
                        If you have any questions, please contact our support team.<br>
                        <strong>LiveOn Team</strong><br>
                        Email: liveonsystem@gmail.com
                    </p>
                </div>
            </div>
        </div>";
    }

    private function generatePasswordChangeTextTemplate(string $name): string
    {
        $currentDate = date('F j, Y \a\t g:i A');

        return "
LiveOn - Password Changed Successfully

Dear {$name},

This email is to confirm that your account password has been successfully changed by an administrator on {$currentDate}.

SECURITY NOTICE: If you did not request this password change, please contact our support team immediately.

You can now log in to your account using your new password. For security purposes, we recommend:
- Keep your password confidential
- Use a strong, unique password
- Log out from shared devices

If you have any questions, please contact our support team.

LiveOn Team
Email: liveonsystem@gmail.com
        ";
    }
}
