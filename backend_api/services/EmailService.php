<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService extends BaseService
{
    private $mailer;

    public function __construct(PDO $pdo, Validator $validator = null)
    {
        parent::__construct($pdo, $validator);
        $this->initializeMailer();
    }

    private function initializeMailer(): void
    {
        try {
            $this->mailer = new PHPMailer(true);
            $this->mailer->isSMTP();
            $this->mailer->Host = 'smtp.gmail.com';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = 'mbenash961030@gmail.com';
            $this->mailer->Password = 'dpgcldgacitgdnfq';
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = 587;
            $this->mailer->isHTML(true);
            $this->mailer->setFrom('mbenash961030@gmail.com', 'LiveOn System');

            // Enhanced settings for better reliability
            $this->mailer->Timeout = 60;
            $this->mailer->SMTPKeepAlive = true;
            $this->mailer->CharSet = 'UTF-8';
        } catch (Exception $e) {
            error_log("Email service initialization failed: " . $e->getMessage());
            throw new Exception("Email service initialization failed: " . $e->getMessage());
        }
    }

    public function sendOTP(string $toEmail, string $toName, string $otp): array
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

            // Validate OTP
            if (!preg_match('/^\d{6}$/', $otp)) {
                return $this->errorResponse('Invalid OTP format');
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'LiveOn Registration OTP';
            $this->mailer->Body = $this->generateOTPEmailTemplate($toName, $otp);

            $this->mailer->send();
            
            // Log successful send
            $this->logEmailUsage('SUCCESS', "OTP sent to $toEmail");

            return $this->successResponse(
                ['email' => $toEmail],
                'OTP sent successfully to ' . $toEmail
            );
        } catch (Exception $e) {
            $errorMsg = $e->getMessage();
            
            // Log the error
            if (strpos($errorMsg, '5.4.5') !== false) {
                $this->logEmailUsage('LIMIT_EXCEEDED', $errorMsg);
            } else {
                $this->logEmailUsage('ERROR', $errorMsg);
            }
            
            return $this->errorResponse('Email could not be sent: ' . $errorMsg);
        }
    }

    public function sendWelcomeEmail(string $toEmail, string $toName): array
    {
        try {
            if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Invalid email address');
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Welcome to LiveOn - Blood Donation Platform';
            $this->mailer->Body = $this->generateWelcomeEmailTemplate($toName);

            $this->mailer->send();

            return $this->successResponse(
                ['email' => $toEmail],
                'Welcome email sent successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse('Welcome email could not be sent: ' . $e->getMessage());
        }
    }

    public function sendDonationRequestEmail(string $toEmail, string $toName, string $hospitalName): array
    {
        try {
            if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Invalid email address');
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Blood Donation Request - LiveOn';
            $this->mailer->Body = $this->generateDonationRequestTemplate($toName, $hospitalName);

            $this->mailer->send();

            return $this->successResponse(
                ['email' => $toEmail],
                'Donation request email sent successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse('Donation request email could not be sent: ' . $e->getMessage());
        }
    }

    public function sendPasswordResetEmail(string $toEmail, string $toName, string $resetToken): array
    {
        try {
            if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Invalid email address');
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Password Reset Request - LiveOn';
            $this->mailer->Body = $this->generatePasswordResetTemplate($toName, $resetToken);

            $this->mailer->send();

            return $this->successResponse(
                ['email' => $toEmail],
                'Password reset email sent successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse('Password reset email could not be sent: ' . $e->getMessage());
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

            // Send the email
            $result = $this->mailer->send();

            if ($result) {
                return $this->successResponse(
                    ['email' => $toEmail],
                    'Password change confirmation email sent successfully'
                );
            } else {
                return $this->errorResponse('Failed to send email - unknown error');
            }
        } catch (Exception $e) {
            // Provide more specific error messages based on the exception
            $errorMessage = $this->parseEmailError($e->getMessage());
            return $this->errorResponse('Password change confirmation email could not be sent: ' . $errorMessage);
        }
    }

    private function generateOTPEmailTemplate(string $name, string $otp): string
    {
        return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>LIVEON</h1>
                <p style='margin: 5px 0 0 0;'>Blood Donation Platform</p>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;'>
                <h2 style='color: #333; margin-bottom: 20px;'>Hello {$name},</h2>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 25px;'>
                    Thank you for registering with LiveOn! To complete your registration, please use the following OTP:
                </p>
                
                <div style='background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;'>
                    <h1 style='margin: 0; font-size: 32px; letter-spacing: 5px;'>{$otp}</h1>
                </div>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                </p>
                
                <div style='background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <p style='margin: 0; color: #495057; font-size: 14px;'>
                        <strong>Security Tip:</strong> Never share this OTP with anyone. LiveOn will never ask for your OTP via phone or email.
                    </p>
                </div>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    If you didn't request this OTP, please ignore this email.
                </p>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='color: #999; font-size: 14px; margin: 0;'>
                        Regards,<br>
                        <strong>LiveOn Team</strong>
                    </p>
                </div>
            </div>
        </div>";
    }

    private function generateWelcomeEmailTemplate(string $name): string
    {
        return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>LIVEON</h1>
                <p style='margin: 5px 0 0 0;'>Welcome to Our Blood Donation Community!</p>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;'>
                <h2 style='color: #333; margin-bottom: 20px;'>Welcome {$name}!</h2>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    Thank you for joining LiveOn! You're now part of a community dedicated to saving lives through blood donation.
                </p>
                
                <div style='background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3 style='color: #155724; margin-top: 0;'>What's Next?</h3>
                    <ul style='color: #155724; margin-bottom: 0;'>
                        <li>Complete your medical verification</li>
                        <li>Set your preferred donation center</li>
                        <li>Start your lifesaving journey!</li>
                    </ul>
                </div>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    Your commitment to blood donation makes a real difference in people's lives. Every donation can save up to 3 lives!
                </p>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='color: #999; font-size: 14px; margin: 0;'>
                        Thank you for being a lifesaver!<br>
                        <strong>LiveOn Team</strong>
                    </p>
                </div>
            </div>
        </div>";
    }

    private function generateDonationRequestTemplate(string $name, string $hospitalName): string
    {
        return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>LIVEON</h1>
                <p style='margin: 5px 0 0 0;'>Blood Donation Request</p>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;'>
                <h2 style='color: #333; margin-bottom: 20px;'>Hello {$name},</h2>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    You have received a blood donation request from <strong>{$hospitalName}</strong>.
                </p>
                
                <div style='background-color: #cce5ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3 style='color: #004085; margin-top: 0;'>Request Details:</h3>
                    <p style='color: #004085; margin-bottom: 0;'>
                        A hospital is in need of blood and has specifically requested your donation. 
                        Please contact the hospital directly for more details about the donation process.
                    </p>
                </div>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    Your donation can make a significant difference in someone's life. Thank you for your commitment to helping others!
                </p>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='color: #999; font-size: 14px; margin: 0;'>
                        Thank you for being a lifesaver!<br>
                        <strong>LiveOn Team</strong>
                    </p>
                </div>
            </div>
        </div>";
    }

    private function generatePasswordResetTemplate(string $name, string $resetToken): string
    {
        return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>LIVEON</h1>
                <p style='margin: 5px 0 0 0;'>Password Reset Request</p>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;'>
                <h2 style='color: #333; margin-bottom: 20px;'>Hello {$name},</h2>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                </p>
                
                <div style='background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3 style='color: #856404; margin-top: 0;'>Reset Token:</h3>
                    <p style='color: #856404; margin-bottom: 0; font-family: monospace; font-size: 18px;'>
                        {$resetToken}
                    </p>
                </div>
                
                <p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
                    Use this token to reset your password. This token will expire in 1 hour for security reasons.
                </p>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <p style='color: #999; font-size: 14px; margin: 0;'>
                        If you have any questions, please contact our support team.<br>
                        <strong>LiveOn Team</strong>
                    </p>
                </div>
            </div>
        </div>";
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
                        Email: mbenash961030@gmail.com
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
Email: mbenash961030@gmail.com
        ";
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
    
    private function logEmailUsage(string $status, string $message): void
    {
        $logFile = __DIR__ . '/../../gmail_usage.log';
        $logEntry = date('Y-m-d H:i:s') . " | $status | $message\n";
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}
