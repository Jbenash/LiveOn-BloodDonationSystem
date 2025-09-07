-- SQL script to add donor reminder functionality

-- Create donor_reminders table to track reminder history
CREATE TABLE `donor_reminders` (
  `reminder_id` int(11) NOT NULL AUTO_INCREMENT,
  `donor_id` varchar(10) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `reminder_type` enum('6_month_general', 'donation_eligible', 'appointment') DEFAULT '6_month_general',
  `sent_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `next_reminder_date` date NOT NULL,
  `message_content` text NOT NULL,
  `status` enum('sent', 'failed', 'pending') DEFAULT 'pending',
  `phone_number` varchar(20) NOT NULL,
  `sms_response` text DEFAULT NULL,
  PRIMARY KEY (`reminder_id`),
  KEY `fk_donor_reminders_donor` (`donor_id`),
  KEY `fk_donor_reminders_user` (`user_id`),
  KEY `idx_next_reminder_date` (`next_reminder_date`),
  KEY `idx_reminder_type_status` (`reminder_type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add foreign key constraints
ALTER TABLE `donor_reminders`
  ADD CONSTRAINT `fk_donor_reminders_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_donor_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

-- Create donor reminder settings table for admin configuration
CREATE TABLE `reminder_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(100) NOT NULL UNIQUE,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_by` varchar(10) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  KEY `fk_reminder_settings_user` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add foreign key constraint for reminder settings
ALTER TABLE `reminder_settings`
  ADD CONSTRAINT `fk_reminder_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

-- Insert default reminder settings
INSERT INTO `reminder_settings` (`setting_name`, `setting_value`, `description`) VALUES
('reminder_interval_months', '6', 'Number of months between reminders'),
('reminder_message_template', 'Hello {donor_name}! It''s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero!', 'Template for 6-month reminder messages. Use {donor_name} for personalization'),
('reminder_enabled', '1', 'Enable or disable automatic reminders (1 = enabled, 0 = disabled)'),
('reminder_time', '09:00:00', 'Time of day to send reminders (24-hour format)'),
('reminder_sender_id', 'LiveOnBD', 'SMS sender ID for reminders');
