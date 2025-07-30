<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../vendor/autoload.php';

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
            $this->mailer->Username = 'liveonsystem@gmail.com';
            $this->mailer->Password = 'jzjcyywthodnlrew';
            $this->mailer->SMTPSecure = 'tls';
            $this->mailer->Port = 587;
            $this->mailer->isHTML(true);
            $this->mailer->setFrom('liveonsystem@gmail.com', 'LiveOn System');
        } catch (Exception $e) {
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

            return $this->successResponse(
                ['email' => $toEmail],
                'OTP sent successfully to ' . $toEmail
            );
        } catch (Exception $e) {
            return $this->errorResponse('Email could not be sent: ' . $e->getMessage());
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
}
