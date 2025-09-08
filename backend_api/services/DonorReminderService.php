<?php

namespace LiveOn\Services;

require_once __DIR__ . '/../config/db_connection.php';

class DonorReminderService
{
    private $pdo;

    public function __construct()
    {
        try {
            $database = new \Database();
            $this->pdo = $database->connect();
        } catch (\Exception $e) {
            error_log("DonorReminderService: Database connection failed - " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get reminder settings from database
     */
    public function getReminderSettings()
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT setting_name, setting_value 
                FROM reminder_settings 
                WHERE setting_name IN ('reminder_enabled', 'reminder_interval_months', 'reminder_message_template', 'reminder_sender_id')
            ");
            $stmt->execute();
            $settings = [];
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $settings[$row['setting_name']] = $row['setting_value'];
            }
            return $settings;
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to get settings - " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get donors who need reminders
     */
    public function getDonorsNeedingReminders()
    {
        try {
            $settings = $this->getReminderSettings();
            if (!isset($settings['reminder_enabled']) || $settings['reminder_enabled'] != '1') {
                return [];
            }

            $intervalMonths = $settings['reminder_interval_months'] ?? 6;

            $stmt = $this->pdo->prepare("
                SELECT DISTINCT 
                    d.donor_id,
                    d.user_id,
                    u.name,
                    u.phone,
                    u.email,
                    d.status as donor_status,
                    u.status as user_status,
                    COALESCE(dr.last_reminder, '2000-01-01') as last_reminder,
                    DATE_ADD(COALESCE(dr.last_reminder, d.registration_date), INTERVAL ? MONTH) as next_reminder_due
                FROM donors d
                JOIN users u ON d.user_id = u.user_id
                LEFT JOIN (
                    SELECT 
                        donor_id, 
                        MAX(sent_date) as last_reminder
                    FROM donor_reminders 
                    WHERE status = 'sent' AND (reminder_type = '6_month_general' OR reminder_type = '' OR reminder_type IS NULL)
                    GROUP BY donor_id
                ) dr ON d.donor_id = dr.donor_id
                WHERE u.status = 'active' 
                    AND d.status = 'available'
                    AND u.phone IS NOT NULL 
                    AND u.phone != ''
                    AND (
                        dr.last_reminder IS NULL 
                        OR DATE_ADD(dr.last_reminder, INTERVAL ? MONTH) <= CURDATE()
                    )
                ORDER BY next_reminder_due ASC
            ");
            $stmt->execute([$intervalMonths, $intervalMonths]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to get donors needing reminders - " . $e->getMessage());
            return [];
        }
    }

    /**
     * Send SMS reminder to a donor
     */
    public function sendSMSReminder($donorData)
    {
        try {
            $settings = $this->getReminderSettings();
            $messageTemplate = $settings['reminder_message_template'] ?? 'Hello {donor_name}! It\'s time for your regular reminder from LiveOn blood donation system. Thank you for being a hero!';
            $senderId = $settings['reminder_sender_id'] ?? 'TextLKDemo';

            // Personalize message
            $message = str_replace('{donor_name}', $donorData['name'], $messageTemplate);

            // Prepare SMS data
            $smsData = [
                'phone' => $donorData['phone'],
                'message' => $message
            ];

            // Send SMS using existing SMS functionality
            $smsResult = $this->sendSMS($smsData['phone'], $smsData['message'], $senderId);

            // Calculate next reminder date
            $intervalMonths = $settings['reminder_interval_months'] ?? 6;
            $nextReminderDate = date('Y-m-d', strtotime("+{$intervalMonths} months"));

            // Log reminder in database
            $this->logReminder(
                $donorData['donor_id'],
                $donorData['user_id'],
                '6_month_general',
                $message,
                $donorData['phone'],
                $nextReminderDate,
                $smsResult['success'] ? 'sent' : 'failed',
                $smsResult['response']
            );

            return $smsResult;
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to send SMS reminder - " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send SMS using text.lk API
     */
    public function sendSMS($phone, $message, $senderId = 'TextLKDemo')
    {
        try {
            // API credentials (should be moved to config file)
            $apiToken = '1112|t7WOaGcSTUjADQn7xz9EzKd8flS5qiIGXPNSHA7d251317e8';

            $payload = [
                'recipient' => $phone,
                'sender_id' => $senderId,
                'type' => 'plain',
                'message' => $message,
            ];

            $ch = curl_init('https://app.text.lk/api/v3/sms/send');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $apiToken,
                'Content-Type: application/json',
                'Accept: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

            $response = curl_exec($ch);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return ['success' => false, 'error' => $error, 'response' => null];
            }

            $responseData = json_decode($response, true);
            return [
                'success' => true,
                'response' => $response,
                'data' => $responseData
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'response' => null];
        }
    }

    /**
     * Log reminder to database
     */
    private function logReminder($donorId, $userId, $reminderType, $messageContent, $phoneNumber, $nextReminderDate, $status, $smsResponse)
    {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO donor_reminders 
                (donor_id, user_id, reminder_type, message_content, phone_number, next_reminder_date, status, sms_response)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $donorId,
                $userId,
                $reminderType,
                $messageContent,
                $phoneNumber,
                $nextReminderDate,
                $status,
                $smsResponse
            ]);
            return true;
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to log reminder - " . $e->getMessage());
            return false;
        }
    }

    /**
     * Process all pending reminders
     */
    public function processAllReminders()
    {
        try {
            $donors = $this->getDonorsNeedingReminders();
            $results = [
                'total_processed' => 0,
                'successful' => 0,
                'failed' => 0,
                'errors' => []
            ];

            foreach ($donors as $donor) {
                $results['total_processed']++;
                $result = $this->sendSMSReminder($donor);

                if ($result['success']) {
                    $results['successful']++;
                    error_log("DonorReminderService: Sent reminder to {$donor['name']} ({$donor['phone']})");
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to send to {$donor['name']} ({$donor['phone']}): " . ($result['error'] ?? 'Unknown error');
                    error_log("DonorReminderService: Failed to send reminder to {$donor['name']} ({$donor['phone']}) - " . ($result['error'] ?? 'Unknown error'));
                }
            }

            return $results;
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to process reminders - " . $e->getMessage());
            return [
                'total_processed' => 0,
                'successful' => 0,
                'failed' => 0,
                'errors' => [$e->getMessage()]
            ];
        }
    }

    /**
     * Get reminder statistics
     */
    public function getReminderStats($days = 30)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_reminders,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_reminders,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_reminders,
                    COUNT(DISTINCT donor_id) as unique_donors_contacted
                FROM donor_reminders
                WHERE sent_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ");
            $stmt->execute([$days]);
            return $stmt->fetch(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log("DonorReminderService: Failed to get reminder stats - " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update reminder settings
     */
    public function updateReminderSettings($settings, $updatedBy)
    {
        try {
            $this->pdo->beginTransaction();

            foreach ($settings as $settingName => $settingValue) {
                $stmt = $this->pdo->prepare("
                    INSERT INTO reminder_settings (setting_name, setting_value, updated_by)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    updated_by = VALUES(updated_by),
                    updated_at = CURRENT_TIMESTAMP
                ");
                $stmt->execute([$settingName, $settingValue, $updatedBy]);
            }

            $this->pdo->commit();
            return true;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("DonorReminderService: Failed to update settings - " . $e->getMessage());
            return false;
        }
    }
}
