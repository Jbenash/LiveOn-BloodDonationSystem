-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 08, 2025 at 08:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `liveon_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_logs`
--

CREATE TABLE `admin_logs` (
  `log_id` int(11) NOT NULL,
  `admin_id` varchar(10) DEFAULT NULL,
  `action` text DEFAULT NULL,
  `target_table` varchar(50) DEFAULT NULL,
  `target_id` varchar(10) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_logs`
--

INSERT INTO `admin_logs` (`log_id`, `admin_id`, `action`, `target_table`, `target_id`, `timestamp`) VALUES
(1, 'US004', 'Approved donor registration', 'donors', 'DN001', '2025-07-03 18:37:19'),
(2, 'US006', 'Approved feedback', 'feedback', 'FB007', '2025-08-24 17:52:20'),
(3, 'US006', 'Approved feedback', 'feedback', 'FB004', '2025-08-24 17:52:35'),
(4, 'US006', 'Rejected feedback', 'feedback', 'FB66410858', '2025-09-06 15:01:41'),
(5, 'US006', 'Rejected feedback', 'feedback', 'FB66410858', '2025-09-06 15:02:00'),
(6, 'US006', 'Rejected feedback', 'feedback', 'FB66410858', '2025-09-06 15:30:31'),
(7, 'US006', 'User status changed to rejected: Ben Asher (mbenash961030@gmail.com)', 'users', 'US68bd125b', '2025-09-07 06:35:47'),
(8, 'US006', 'Donor status changed to rejected: abinath (abinath157@gmail.com)', 'donors', 'DN68711744', '2025-09-07 16:24:19');

-- --------------------------------------------------------

--
-- Table structure for table `blood_inventory`
--

CREATE TABLE `blood_inventory` (
  `blood_id` varchar(10) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `units_available` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_inventory`
--

INSERT INTO `blood_inventory` (`blood_id`, `hospital_id`, `blood_type`, `units_available`, `last_updated`) VALUES
('6', 'HS002', 'B-', 10, '2025-07-03 18:21:09'),
('7', 'HS003', 'O-', 7, '2025-07-19 08:44:26'),
('BLD0774', 'HS003', 'AB-', 10, '2025-07-19 09:17:44'),
('BLD3279', 'HS001', 'O-', 777, '2025-09-07 16:10:14'),
('BLD4469', 'HS002', 'O-', 40, '2025-07-23 07:22:37'),
('BLD5106', 'HS003', 'B-', 234, '2025-09-06 03:33:10'),
('BLD5131', 'HS002', 'AB-', 444, '2025-07-20 09:27:05'),
('BLD6722', 'HS004', 'O+', 30, '2025-07-23 05:13:45'),
('BLD9139', 'HS001', 'AB+', 561, '2025-09-05 19:20:01');

-- --------------------------------------------------------

--
-- Table structure for table `donations`
--

CREATE TABLE `donations` (
  `donation_id` int(11) NOT NULL,
  `donor_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `donation_date` date DEFAULT NULL,
  `units_donated` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donations`
--

INSERT INTO `donations` (`donation_id`, `donor_id`, `hospital_id`, `blood_type`, `donation_date`, `units_donated`) VALUES
(88, 'DN68bdaba1', 'HS001', 'O-', '2025-09-07', 777);

--
-- Triggers `donations`
--
DELIMITER $$
CREATE TRIGGER `trg_update_blood_inventory` AFTER INSERT ON `donations` FOR EACH ROW BEGIN
    DECLARE existing_units INT;

    -- Check if blood type already exists for the hospital
    SELECT units_available INTO existing_units
    FROM blood_inventory
    WHERE hospital_id = NEW.hospital_id AND blood_type = NEW.blood_type
    LIMIT 1;

    IF existing_units IS NOT NULL THEN
        -- Update existing record and timestamp
        UPDATE blood_inventory
        SET 
            units_available = units_available + NEW.units_donated,
            last_updated = NOW()
        WHERE hospital_id = NEW.hospital_id AND blood_type = NEW.blood_type;
    ELSE
        -- Insert new inventory row with current timestamp
        INSERT INTO blood_inventory (blood_id, hospital_id, blood_type, units_available, last_updated)
        VALUES (
            CONCAT('BLD', LPAD(FLOOR(RAND() * 9999), 4, '0')),
            NEW.hospital_id,
            NEW.blood_type,
            NEW.units_donated,
            NOW()
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `donation_requests`
--

CREATE TABLE `donation_requests` (
  `request_id` varchar(10) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','fulfilled','cancelled') DEFAULT 'pending',
  `request_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `donor_id` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donation_requests`
--

INSERT INTO `donation_requests` (`request_id`, `hospital_id`, `blood_type`, `reason`, `status`, `request_date`, `donor_id`) VALUES
('DR001', 'HS001', 'O+', 'Accident emergency case requiring urgent blood', 'pending', '2025-07-03 18:34:34', NULL),
('DR002', 'HS002', 'A-', 'Surgery scheduled for tomorrow', 'pending', '2025-07-03 18:34:34', NULL),
('DR003', 'HS001', 'B+', 'Patient with anemia requires transfusion', 'fulfilled', '2025-07-02 18:34:34', NULL),
('DR004', 'HS002', 'AB-', 'Rare blood needed for child in ICU', 'pending', '2025-07-03 18:34:34', NULL),
('REQ687f4a8', 'HS001', 'O+', 'we need your blood ', 'pending', '2025-07-22 08:23:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

CREATE TABLE `donors` (
  `donor_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `last_donation_date` datetime(3) DEFAULT NULL,
  `next_eligible_date` date DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `lives_saved` int(11) DEFAULT 0,
  `status` enum('available','not available') DEFAULT 'not available',
  `donor_image` longblob DEFAULT NULL,
  `donor_card` longblob DEFAULT NULL,
  `preferred_hospital_id` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`donor_id`, `user_id`, `dob`, `blood_type`, `address`, `city`, `last_donation_date`, `next_eligible_date`, `registration_date`, `lives_saved`, `status`, `donor_image`, `donor_card`, `preferred_hospital_id`) VALUES
('DN686a6923', 'US686a6923', '2025-07-18', 'B-', 'Trinco', 'trinco', '2025-07-10 00:00:00.000', NULL, NULL, 0, 'available', NULL, NULL, 'HS001'),
('DN68711744', 'US68711744', '2025-07-17', 'A+', 'neliyady', 'neliyady', '2025-07-19 13:49:55.081', NULL, NULL, 0, 'not available', NULL, NULL, NULL),
('DN68727a8c', 'US68727a8c', '2025-07-31', 'B+', 'jaffna', 'jaffna', '2025-07-19 01:49:55.968', NULL, NULL, 20, 'available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383732376138635f313735323333373636352e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383732376138635f323032352d30372d31325f31382d32362d35382e706466, NULL),
('DN6874b688', 'US6874b688', '2002-02-22', 'O+', 'sdfsdfdsfd', 'Ampara', '2025-07-23 13:15:38.697', '2025-09-17', '2025-07-14', 0, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383734623638385f313735333231313833372e706e67, NULL, 'HS001'),
('DN68bd125b', 'US68bd125b', '2002-02-22', 'AB+', 'Vavuniya', 'Vavuniya', NULL, NULL, '2025-09-07', 0, 'available', NULL, 0x443a5c58616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36386264313235625f323032352d30392d30375f30372d30352d31392e706466, 'HS001'),
('DN68bdaba1', 'US68bdaba1', '2002-02-22', 'O-', 'Vavuniya', 'Mullaitivu', '2025-09-07 21:40:08.696', '2025-11-02', '2025-09-07', 0, 'not available', NULL, 0x443a5c58616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36386264616261315f323032352d30392d30375f31372d35392d33352e706466, 'HS001');

-- --------------------------------------------------------

--
-- Table structure for table `donor_achievements`
--

CREATE TABLE `donor_achievements` (
  `id` int(11) NOT NULL,
  `achievement_name` varchar(100) NOT NULL,
  `achievement_type` enum('milestone','special','consistency','emergency') NOT NULL,
  `trigger_condition` varchar(255) NOT NULL,
  `badge_icon` varchar(255) DEFAULT NULL,
  `points_reward` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `donor_reminders`
--

CREATE TABLE `donor_reminders` (
  `reminder_id` int(11) NOT NULL,
  `donor_id` varchar(10) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `reminder_type` enum('6_month_general','donation_eligible','appointment') DEFAULT '6_month_general',
  `sent_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `next_reminder_date` date NOT NULL,
  `message_content` text NOT NULL,
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `phone_number` varchar(20) NOT NULL,
  `sms_response` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donor_reminders`
--

INSERT INTO `donor_reminders` (`reminder_id`, `donor_id`, `user_id`, `reminder_type`, `sent_date`, `next_reminder_date`, `message_content`, `status`, `phone_number`, `sms_response`) VALUES
(4, 'DN68bd125b', 'US68bd125b', '', '2025-09-07 19:18:39', '2025-09-07', 'Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [FORCED TEST at 21:18:36]', 'sent', '0760312229', '{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bdda8e91abf\",\"to\":\"94760312229\",\"from\":\"TextLKDemo\",\"message\":\"Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [FORCED TEST at 21:18:36]\",\"status\":\"Delivered\",\"cost\":\"2\",\"sms_count\":2}}'),
(5, 'DN68bd125b', 'US68bd125b', '', '2025-09-07 19:26:20', '2025-09-07', 'Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 1 at 21:26:18]', 'sent', '0760312229', '{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bddc5c35559\",\"to\":\"94760312229\",\"from\":\"TextLKDemo\",\"message\":\"Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 1 at 21:26:18]\",\"status\":\"Delivered\",\"cost\":\"2\",\"sms_count\":2}}'),
(6, 'DN68bd125b', 'US68bd125b', '', '2025-09-07 19:27:31', '2025-09-07', 'Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 2 at 21:27:29]', 'sent', '0760312229', '{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bddca3030bb\",\"to\":\"94760312229\",\"from\":\"TextLKDemo\",\"message\":\"Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 2 at 21:27:29]\",\"status\":\"Delivered\",\"cost\":\"2\",\"sms_count\":2}}'),
(7, 'DN68bd125b', 'US68bd125b', '', '2025-09-07 19:28:39', '2025-09-07', 'Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 3 at 21:28:37]', 'sent', '0760312229', '{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bddce726fef\",\"to\":\"94760312229\",\"from\":\"TextLKDemo\",\"message\":\"Hello Ben Asher! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero! [Test 3 at 21:28:37]\",\"status\":\"Delivered\",\"cost\":\"2\",\"sms_count\":2}}'),
(8, 'DN68727a8c', 'US68727a8c', '6_month_general', '2025-09-07 20:15:01', '0000-00-00', 'Hello Abiramy! This is a TEST SMS from LiveOn blood donation system at 22:14:58. All 3 donors should receive this message! Thank you for being a hero! 🩸', 'sent', '0778200752', '{\"success\":true,\"response\":\"{\\\"status\\\":\\\"success\\\",\\\"message\\\":\\\"Your message was successfully delivered\\\",\\\"data\\\":{\\\"uid\\\":\\\"68bde7c4994a3\\\",\\\"to\\\":\\\"94778200752\\\",\\\"from\\\":\\\"TextLKDemo\\\",\\\"message\\\":\\\"Hello Abiramy! This is a TEST SMS from LiveOn blood donation system at 22:14:58. All 3 donors should receive this message! Thank you for being a hero! \\\\ud83e\\\\ude78\\\",\\\"status\\\":\\\"Delivered\\\",\\\"cost\\\":\\\"3\\\",\\\"sms_count\\\":3}}\",\"data\":{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bde7c4994a3\",\"to\":\"94778200752\",\"from\":\"TextLKDemo\",\"message\":\"Hello Abiramy! This is a TEST SMS from LiveOn blood donation system at 22:14:58. All 3 donors should receive this message! Thank you for being a hero! \\ud83e\\ude78\",\"status\":\"Delivered\",\"cost\":\"3\",\"sms_count\":3}}}'),
(9, 'DN686a6923', 'US686a6923', '6_month_general', '2025-09-07 20:15:05', '0000-00-00', 'Hello nilaxsan! This is a TEST SMS from LiveOn blood donation system at 22:15:04. All 3 donors should receive this message! Thank you for being a hero! 🩸', 'sent', '0776104689', '{\"success\":true,\"response\":\"{\\\"status\\\":\\\"success\\\",\\\"message\\\":\\\"Your message was successfully delivered\\\",\\\"data\\\":{\\\"uid\\\":\\\"68bde7c97bd24\\\",\\\"to\\\":\\\"94776104689\\\",\\\"from\\\":\\\"TextLKDemo\\\",\\\"message\\\":\\\"Hello nilaxsan! This is a TEST SMS from LiveOn blood donation system at 22:15:04. All 3 donors should receive this message! Thank you for being a hero! \\\\ud83e\\\\ude78\\\",\\\"status\\\":\\\"Delivered\\\",\\\"cost\\\":\\\"3\\\",\\\"sms_count\\\":3}}\",\"data\":{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"68bde7c97bd24\",\"to\":\"94776104689\",\"from\":\"TextLKDemo\",\"message\":\"Hello nilaxsan! This is a TEST SMS from LiveOn blood donation system at 22:15:04. All 3 donors should receive this message! Thank you for being a hero! \\ud83e\\ude78\",\"status\":\"Delivered\",\"cost\":\"3\",\"sms_count\":3}}}');

-- --------------------------------------------------------

--
-- Table structure for table `donor_requests`
--

CREATE TABLE `donor_requests` (
  `request_id` varchar(10) NOT NULL,
  `donor_id` varchar(10) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `dob` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `preferred_hospital_id` varchar(10) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donor_requests`
--

INSERT INTO `donor_requests` (`request_id`, `donor_id`, `user_id`, `dob`, `address`, `city`, `preferred_hospital_id`, `status`, `created_at`, `updated_at`) VALUES
('DR68b75bd1', 'DN68b75bd1', 'TEST68b75b', '1990-01-01', '123 Test Street', 'Test City', 'HS001', 'rejected', '2025-09-02 21:04:17', '2025-09-06 03:43:12'),
('DR68bd125b', 'DN68bd125b', 'US68bd125b', '2002-02-22', 'Vavuniya', 'Vavuniya', 'HS001', 'approved', '2025-09-07 05:04:27', '2025-09-07 05:05:19'),
('DR68bdaba1', 'DN68bdaba1', 'US68bdaba1', '2002-02-22', 'Vavuniya', 'Mullaitivu', 'HS001', 'approved', '2025-09-07 15:58:25', '2025-09-07 15:59:35'),
('DRA53302', 'DBA6B92', 'US001', '1990-01-15', '123 Main Street', 'Sample City', 'HS002', 'pending', '2025-08-24 17:56:54', '2025-08-24 17:56:54');

-- --------------------------------------------------------

--
-- Table structure for table `donor_rewards`
--

CREATE TABLE `donor_rewards` (
  `id` int(11) NOT NULL,
  `donor_id` varchar(50) NOT NULL,
  `tier_id` int(11) DEFAULT NULL,
  `current_points` int(11) DEFAULT 0,
  `total_points_earned` int(11) DEFAULT 0,
  `total_points_spent` int(11) DEFAULT 0,
  `current_streak` int(11) DEFAULT 0,
  `longest_streak` int(11) DEFAULT 0,
  `last_donation_date` date DEFAULT NULL,
  `achievements_earned` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`achievements_earned`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donor_rewards`
--

INSERT INTO `donor_rewards` (`id`, `donor_id`, `tier_id`, `current_points`, `total_points_earned`, `total_points_spent`, `current_streak`, `longest_streak`, `last_donation_date`, `achievements_earned`, `created_at`, `updated_at`) VALUES
(1, 'DN6874b688', NULL, 0, 0, 0, 0, 0, NULL, NULL, '2025-08-24 20:24:19', '2025-08-24 20:24:19'),
(4, 'DN68bd125b', NULL, 0, 0, 0, 0, 0, NULL, NULL, '2025-09-07 06:36:56', '2025-09-07 06:36:56'),
(5, 'DN68bdaba1', NULL, 0, 0, 0, 0, 0, NULL, NULL, '2025-09-07 16:00:33', '2025-09-07 16:00:33'),
(6, 'DN686a6923', NULL, 0, 0, 0, 0, 0, NULL, NULL, '2025-09-07 16:04:24', '2025-09-07 16:04:24');

-- --------------------------------------------------------

--
-- Table structure for table `donor_tiers`
--

CREATE TABLE `donor_tiers` (
  `id` int(11) NOT NULL,
  `tier_name` varchar(50) NOT NULL,
  `tier_level` int(11) NOT NULL,
  `min_donations` int(11) NOT NULL,
  `badge_icon` varchar(255) DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `educational_content`
--

CREATE TABLE `educational_content` (
  `content_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` enum('article','tip','faq') DEFAULT 'article',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `educational_content`
--

INSERT INTO `educational_content` (`content_id`, `title`, `description`, `type`, `created_at`) VALUES
(1, 'Benefits of Blood Donation', 'Donating blood saves lives and improves health.', 'article', '2025-07-03 18:37:04'),
(2, 'How to Prepare for Donation', 'Eat well and stay hydrated before donating.', 'tip', '2025-07-03 18:37:04');

-- --------------------------------------------------------

--
-- Table structure for table `email_notifications_log`
--

CREATE TABLE `email_notifications_log` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` enum('sent','failed','pending','logged') NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `message` text DEFAULT NULL,
  `error_details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `email_notifications_log`
--

INSERT INTO `email_notifications_log` (`id`, `email`, `name`, `type`, `status`, `sent_at`, `message`, `error_details`, `created_at`, `updated_at`) VALUES
(1, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:16:53', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:16:53', '2025-09-06 18:16:53'),
(2, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:17:50', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:17:50', '2025-09-06 18:17:50'),
(3, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:18:19', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:18:19', '2025-09-06 18:18:19'),
(4, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:21:25', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:21:25', '2025-09-06 18:21:25'),
(5, 'test1@example.com', 'Test User 1', 'password_change', 'logged', '2025-09-06 18:21:28', 'Password change confirmation for Test User 1 (logged)', NULL, '2025-09-06 18:21:28', '2025-09-06 18:21:28'),
(6, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:21:48', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:21:48', '2025-09-06 18:21:48'),
(7, 'test1@example.com', 'Test User 1', 'password_change', 'logged', '2025-09-06 18:21:51', 'Password change confirmation for Test User 1 (logged)', NULL, '2025-09-06 18:21:51', '2025-09-06 18:21:51'),
(8, 'user@example.com', 'John Doe', 'password_change', 'logged', '2025-09-06 18:23:06', 'Password change confirmation for John Doe (logged)', NULL, '2025-09-06 18:23:06', '2025-09-06 18:23:06'),
(9, 'test1@example.com', 'Test User 1', 'password_change', 'logged', '2025-09-06 18:23:06', 'Password change confirmation for Test User 1 (logged)', NULL, '2025-09-06 18:23:06', '2025-09-06 18:23:06'),
(10, 'test@example.com', 'Test Donor', 'password_change', 'logged', '2025-09-06 18:24:54', 'Password change confirmation for Test Donor (logged)', NULL, '2025-09-06 18:24:54', '2025-09-06 18:24:54'),
(11, 'jbenash0729@gmail.com', 'Ben Asherrr', 'password_change', 'logged', '2025-09-06 18:25:34', 'Password change confirmation for Ben Asherrr (logged)', NULL, '2025-09-06 18:25:34', '2025-09-06 18:25:34'),
(12, 'jbenash0729@gmail.com', 'Ben Asherrr', 'password_change', 'logged', '2025-09-06 18:27:01', 'Password change confirmation for Ben Asherrr (logged)', NULL, '2025-09-06 18:27:01', '2025-09-06 18:27:01'),
(13, 'mbenash961030@gmail.com', 'Ben Asher', 'password_change', 'logged', '2025-09-06 18:44:13', 'Password change confirmation for Ben Asher (logged)', NULL, '2025-09-06 18:44:13', '2025-09-06 18:44:13'),
(14, 'mbenash961030@gmail.com', 'Ben Asher', 'password_change', 'logged', '2025-09-07 05:08:08', 'Password change confirmation for Ben Asher (logged)', NULL, '2025-09-07 05:08:08', '2025-09-07 05:08:08'),
(15, 'mbenash961030@gmail.com', 'Ben Asher', 'password_change', 'logged', '2025-09-07 05:40:08', 'Password change confirmation for Ben Asher (logged)', NULL, '2025-09-07 05:40:08', '2025-09-07 05:40:08'),
(16, 'mbenash961030@gmail.com', 'Ben Asher', 'password_change', 'logged', '2025-09-07 05:48:25', 'Password change confirmation for Ben Asher (logged)', NULL, '2025-09-07 05:48:25', '2025-09-07 05:48:25'),
(17, 'mbenash961030@gmail.com', 'Ben Asher', 'password_change', 'logged', '2025-09-07 06:05:00', 'Password change confirmation for Ben Asher (logged)', NULL, '2025-09-07 06:05:00', '2025-09-07 06:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_requests`
--

CREATE TABLE `emergency_requests` (
  `emergency_id` int(11) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `required_units` int(11) DEFAULT NULL,
  `status` enum('critical','normal') DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_requests`
--

INSERT INTO `emergency_requests` (`emergency_id`, `hospital_id`, `blood_type`, `required_units`, `status`, `created_at`) VALUES
(1, 'HS001', 'O+', 5, '', '2025-07-03 18:36:20'),
(2, 'HS001', 'A-', 2, '', '2025-07-19 08:26:13'),
(3, 'HS001', 'A-', 9, '', '2025-07-20 06:48:27');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `role` enum('donor','hospital','mro','admin') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`feedback_id`, `user_id`, `role`, `message`, `created_at`, `approved`) VALUES
('FB001', 'US008', 'hospital', 'The donation process was smooth and staff were very helpful!', '2025-07-10 05:15:00', 1),
('FB002', 'US0011', 'mro', 'The new dashboard really helps track donor information efficiently.', '2025-07-11 04:00:00', 1),
('FB003', 'US007', 'hospital', 'We received emergency blood supply in time. Excellent coordination!', '2025-07-12 09:50:00', 1),
('FB004', 'US001', 'donor', 'I would appreciate more updates about my donation impact.', '2025-07-13 07:40:00', 1),
('FB005', 'US009', 'hospital', 'Can we have SMS alerts for donation eligibility renewals?', '2025-07-13 12:10:00', 1),
('FB007', 'US0010', 'mro', 'Proud to be part of this platform. Blood saves lives!', '2025-07-15 03:20:00', 1),
('FB66410858', NULL, 'admin', 'ADMIN CONTACT FORM\n===================\n\nName: Ben Asher\nEmail: mbenash961030@gmail.com\nSubject: hello\n\nMessage:\ndfsdfs\n\nContact Type: admin_contact\nSubmitted: 2025-09-06 13:09:24', '2025-09-06 11:09:24', -1);

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `hospital_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `user_id` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`hospital_id`, `name`, `location`, `contact_email`, `contact_phone`, `user_id`) VALUES
('HS001', 'National Hospital', 'Badulla', 'hospital@badulla.com', '0112345678', 'US003'),
('HS002', 'Kandy General Hospital', 'Kandy', 'info@kgh.lkk', '0812345678', 'US0010'),
('HS003', 'District General Hospital Jaffna', 'Jaffna', 'hospital@jaffna.com', '123456', 'US007'),
('HS004', 'District General Hospital Colombo', 'Colombo', 'hospital@colombo.com', '123456', 'US008');

-- --------------------------------------------------------

--
-- Table structure for table `medical_verifications`
--

CREATE TABLE `medical_verifications` (
  `verification_id` varchar(10) NOT NULL,
  `donor_id` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `mro_id` varchar(10) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `doctor_notes` text DEFAULT NULL,
  `verification_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_verifications`
--

INSERT INTO `medical_verifications` (`verification_id`, `donor_id`, `age`, `mro_id`, `height_cm`, `weight_kg`, `medical_history`, `doctor_notes`, `verification_date`) VALUES
('MV28ab1c62', 'DN68bd125b', 24, 'MRO001', 44.00, 44.00, 'ddfaf', 'asdfsaf', '2025-09-06 18:30:00'),
('MVbe732513', 'DN68bdaba1', 34, 'MRO001', 44.00, 77.00, 'njlklk', 'jnjkl', '2025-09-06 18:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `mro_officers`
--

CREATE TABLE `mro_officers` (
  `mro_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mro_officers`
--

INSERT INTO `mro_officers` (`mro_id`, `user_id`, `hospital_id`) VALUES
('MRO001', 'US002', 'HS001'),
('MRO002', 'US009', 'HS003'),
('MRO003', 'US0010', 'HS004'),
('MRO004', 'US0011', 'HS004');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('info','request','reminder','alert') DEFAULT 'info',
  `status` enum('unread','read') DEFAULT 'unread',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `type`, `status`, `timestamp`) VALUES
(111, 'US68bdaba1', 'New donor registration request: Ben Asher', 'info', 'read', '2025-09-07 15:58:25'),
(112, 'US68bdaba1', 'Donor verified: DN68bdaba1', '', 'read', '2025-09-07 15:59:35'),
(113, 'US68bdaba1', 'New donation recorded: DON20250907181014222', '', 'read', '2025-09-07 16:10:14'),
(114, 'US68711744', 'Your donor account has been deactivated by an administrator. Contact support if you believe this is an error.', '', 'read', '2025-09-07 16:24:19');

-- --------------------------------------------------------

--
-- Table structure for table `otp_verification`
--

CREATE TABLE `otp_verification` (
  `otp_id` int(11) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `otp_code` varchar(10) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otp_verification`
--

INSERT INTO `otp_verification` (`otp_id`, `user_id`, `otp_code`, `expires_at`, `verified`, `created_at`, `verified_at`) VALUES
(10, 'US686a6923', '980635', '2025-07-06 14:26:35', 0, '2025-07-06 12:16:35', '2025-07-06 17:46:57'),
(25, 'US68711744', '538653', '2025-07-11 16:03:08', 1, '2025-07-11 13:53:08', '2025-07-11 19:24:07'),
(28, 'US68727a8c', '978853', '2025-07-12 17:19:00', 0, '2025-07-12 15:09:00', NULL),
(32, 'US6874b688', '496150', '2025-07-14 09:59:28', 1, '2025-07-14 07:49:28', '2025-07-14 13:19:52'),
(48, 'US68bd125b', '144707', '2025-09-07 07:14:27', 1, '2025-09-07 05:04:27', '2025-09-07 10:34:44'),
(51, 'US68bdaba1', '994963', '2025-09-07 18:08:25', 1, '2025-09-07 15:58:25', '2025-09-07 21:28:56');

-- --------------------------------------------------------

--
-- Table structure for table `partner_rewards`
--

CREATE TABLE `partner_rewards` (
  `id` int(11) NOT NULL,
  `partner_name` varchar(100) NOT NULL,
  `partner_type` enum('hospital','restaurant','hotel','travel','health') NOT NULL,
  `reward_description` text DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `points_required` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_requests`
--

CREATE TABLE `password_reset_requests` (
  `request_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `requested_password` varchar(255) NOT NULL,
  `status` enum('pending','completed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_reset_requests`
--

INSERT INTO `password_reset_requests` (`request_id`, `user_id`, `requested_password`, `status`, `created_at`, `completed_at`) VALUES
(1, 'US006', '123456', 'rejected', '2025-07-21 17:13:03', '2025-09-06 18:43:25'),
(2, 'US686d589f', '123456', 'pending', '2025-07-21 17:21:26', NULL),
(3, 'US686d589f', '123456', 'pending', '2025-07-21 17:21:52', NULL),
(4, 'US686d589f', '123456', 'pending', '2025-07-21 17:28:56', NULL),
(5, 'US686d589f', '123456', 'pending', '2025-07-21 17:33:52', NULL),
(6, 'US686d589f', '123456', 'pending', '2025-07-21 17:45:22', NULL),
(11, 'TEST68b75b', 'test123456', 'completed', '2025-09-06 12:05:45', '2025-09-06 18:24:54'),
(13, 'US68bd125b', '123456', 'completed', '2025-09-07 05:06:17', '2025-09-07 05:08:08'),
(14, 'US68bd125b', '123456', 'completed', '2025-09-07 05:39:55', '2025-09-07 05:40:08'),
(15, 'US68bd125b', '12345678910', 'completed', '2025-09-07 05:47:44', '2025-09-07 05:48:25'),
(16, 'US68bd125b', '123456', 'completed', '2025-09-07 06:04:45', '2025-09-07 06:05:00'),
(17, 'US68bd125b', '123456', 'completed', '2025-09-07 06:16:03', '2025-09-07 06:16:22'),
(18, 'US68bd125b', '123456', 'completed', '2025-09-07 06:29:19', '2025-09-07 06:29:32');

-- --------------------------------------------------------

--
-- Table structure for table `reminder_settings`
--

CREATE TABLE `reminder_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_by` varchar(10) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reminder_settings`
--

INSERT INTO `reminder_settings` (`setting_id`, `setting_name`, `setting_value`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'reminder_interval_months', '6', 'Number of months between reminders', 'US006', '2025-09-07 19:59:43'),
(2, 'reminder_message_template', 'Hello {donor_name}! It\'s been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero!', 'Template for 6-month reminder messages. Use {donor_name} for personalization', 'US006', '2025-09-07 19:59:43'),
(3, 'reminder_enabled', '1', 'Enable or disable automatic reminders (1 = enabled, 0 = disabled)', 'US006', '2025-09-07 19:59:43'),
(4, 'reminder_time', '09:00:00', 'Time of day to send reminders (24-hour format)', NULL, '2025-09-07 19:30:57'),
(5, 'reminder_sender_id', 'TextLKDemo', 'SMS sender ID for reminders', 'US006', '2025-09-07 19:59:43');

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `reward_id` int(11) NOT NULL,
  `donor_id` varchar(10) NOT NULL,
  `points` int(11) DEFAULT 0,
  `badge` varchar(50) DEFAULT 'Bronze Donor',
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reward_points_history`
--

CREATE TABLE `reward_points_history` (
  `id` int(11) NOT NULL,
  `donor_id` varchar(10) NOT NULL,
  `points_earned` int(11) NOT NULL,
  `points_spent` int(11) DEFAULT 0,
  `transaction_type` enum('earned','spent','bonus','penalty') NOT NULL,
  `reason` varchar(255) NOT NULL,
  `donation_id` int(11) DEFAULT NULL,
  `achievement_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reward_redemptions`
--

CREATE TABLE `reward_redemptions` (
  `id` int(11) NOT NULL,
  `donor_id` varchar(10) NOT NULL,
  `redemption_type` varchar(100) NOT NULL,
  `points_spent` int(11) NOT NULL,
  `redemption_value` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','approved','redeemed','expired') DEFAULT 'pending',
  `redemption_code` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `success_stories`
--

CREATE TABLE `success_stories` (
  `story_id` varchar(10) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `success_stories`
--

INSERT INTO `success_stories` (`story_id`, `title`, `message`, `created_at`) VALUES
('SS001', 'James Harrison — The Man Who Saved Millions', 'For over 60 years, James Harrison rolled up his sleeve to donate blood—1,173 times to be exact. But what made his donations extraordinary was that his plasma contained a rare antibody used to develop Anti-D injections, which prevent hemolytic disease in unborn babies. Before this treatment was discovered, thousands of babies in Australia were dying each year.\n\nDoctors estimate that James’ blood helped save over 2.4 million babies, including his own grandson. After a lifetime of giving, James retired from donating at age 81 due to age limits—but his legacy continues to live on in the lives of children he never met.\n\n“It’s the only record I hope is broken,” James once said, with a smile that saved nations.\n\n📌 Source: News.com.au', '2025-07-17 03:22:03'),
('SS002', 'Thushan & Raneesha — Birthday Gift of Life', 'On their 20th birthday, Thushan Wijesuriya and Raneesha De Silve chose a unique celebration—they headed to the National Blood Transfusion Center and donated blood. Their combined gift wasn’t just symbolic—it saved 255 lives. Their heartfelt gesture struck a chord nationwide, inspiring many young Sri Lankans to mark milestones not with parties, but with life-saving donations.\n\n📌 Source: NBTS Sri Lanka Facebook page', '2025-07-17 03:09:58'),
('SS003', 'Sustaining the Lifeline—Sri Lanka’s National Blood Effort', 'Every year, Sri Lanka’s National Blood Transfusion Service (NBTS) collects over 350,000 voluntary donations—a mission rooted in public spirit and humanitarian will since 1959. Thanks to campaigns run by mobile units and schools, up to three lives are saved from every single donation. This network of generosity ensures that accident victims, surgical patients, mothers facing postpartum hemorrhages, and individuals with chronic illnesses receive the blood they urgently need.\n\n📌 Sources: Sri Lankan blood donation history, National Blood Transfusion Service data', '2025-07-17 03:09:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('donor','mro','hospital','admin') NOT NULL,
  `status` enum('active','inactive','rejected') DEFAULT 'inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `phone`, `password_hash`, `role`, `status`) VALUES
('TEST68b75b', 'Test Donor', 'test@example.com', '0771234567', '$2y$10$IWosEwClPl4HVrC79OLeBOpEhT6l9ApE4vSBL4gpyAvX3cH.jObeu', 'donor', 'rejected'),
('US001', 'Donor One', 'donor1@example.com', '0771234567', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'donor', 'inactive'),
('US0010', 'Kandy Hospital MRO', 'mro@kandy.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US0011', 'Colombo Hospital MRO', 'mro@colombo.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US002', 'MRO Officer', 'mro@badulla.com', '07787654322', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'mro', 'active'),
('US003', 'National Hospital', 'hospital@badulla.com', '0779999999', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'hospital', 'active'),
('US004', 'Admin User', 'admin@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US005', 'Admin User', 'admin123@liveon.lk', '0770000000', '$2y$10$uGnE0dhpLSE7FqfnhdNZPuWiXdKReWApkd90S1DM54qWwz2kLiapGi', 'admin', 'active'),
('US006', 'Admin User', 'admin234@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US007', 'District General Hospital Jaffna', 'hospital@jaffna.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'hospital', 'active'),
('US008', 'District General Hospital Colombo', 'hospital@colombo.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'hospital', 'active'),
('US009', 'Jaffna Hospital MRO', 'mro@jaffna.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US38B69C8F', 'Test Admin', 'test@admin.com', '0771234567', '$2y$10$if2NlXGdDOstg6AWu2H3NO7PAW.mzAm6WFicRwVHO9/tQOtJZ87oy', 'admin', 'active'),
('US686a6923', 'nilaxsan', 'nilaksh2001@gmail.com', '0776104689', '$2y$10$BSRlvXgaK74oq2Mvn72E5ODQHWsOv1l4rLPJIb3yEx2tR6iq4eINm', 'donor', 'active'),
('US68703e38', 'Vishnu', 'cst22098@std.uwu.ac.lk', '0778799422', '$2y$10$aIdhDU/VwXNMSvOTSjiAH./iXJwdt24d1zroKhBomPSZqUZoHaQji', 'donor', 'inactive'),
('US68711744', 'abinath', 'abinath157@gmail.com', '0741814245', '$2y$10$md0ER0hkvd1V9bZ6bHdC4.p6iqiNnEGOLQECmY6rrAoK515L5xkVa', 'donor', 'rejected'),
('US68727a8c', 'Abiramy', 'abinathan1123@gmail.com', '0778200752', '$2y$10$l6yBPRV.svOcQa3.kW/1wuqyVfowXUejIWjsuTkNsNr6n.UAo7Yp2', 'donor', 'active'),
('US6873e398', 'Mathangey', 'cst22081@std.uwu.ac.lk', '0778200752', '$2y$10$kRo38.tsl.yQjWWPV/Ca1OUU43E/gzjtSxoYT7LHltE8Ve/djsQEO', 'donor', 'active'),
('US6874b688', 'Nuha', 'cst22069@std.uwu.ac.lk', '0757553132', '$2y$10$F.U3BMoSiie7oNVRx9GbveMccIJh5caI691X.4b/TzBs2zx/QEGWS', 'donor', 'inactive'),
('US68bd125b', 'Ben Asher', 'mbenash961030@gmail.com', '0760312229', '$2y$10$5ZjVRZl3IgAJn9TnVVE9ReFIqqghz3BF5V/SkIzVTpnLZWnuFFyTa', 'donor', 'active'),
('US68bdaba1', 'Ben Asher', 'jbenash0729@gmail.com', '0760312229', '$2y$10$.yiT.8g/ei1yi/LIt29EN.jRdEBeAH.Yx1rHtq4dDgPU3XWNJIxdm', 'donor', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `blood_inventory`
--
ALTER TABLE `blood_inventory`
  ADD PRIMARY KEY (`blood_id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `donations`
--
ALTER TABLE `donations`
  ADD PRIMARY KEY (`donation_id`),
  ADD KEY `donor_id` (`donor_id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `donation_requests`
--
ALTER TABLE `donation_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `hospital_id` (`hospital_id`),
  ADD KEY `fk_donation_request_donor` (`donor_id`);

--
-- Indexes for table `donors`
--
ALTER TABLE `donors`
  ADD PRIMARY KEY (`donor_id`),
  ADD KEY `fk_donors_user` (`user_id`),
  ADD KEY `fk_preferred_hospital` (`preferred_hospital_id`);

--
-- Indexes for table `donor_achievements`
--
ALTER TABLE `donor_achievements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `donor_reminders`
--
ALTER TABLE `donor_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `fk_donor_reminders_donor` (`donor_id`),
  ADD KEY `fk_donor_reminders_user` (`user_id`),
  ADD KEY `idx_next_reminder_date` (`next_reminder_date`),
  ADD KEY `idx_reminder_type_status` (`reminder_type`,`status`);

--
-- Indexes for table `donor_requests`
--
ALTER TABLE `donor_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `preferred_hospital_id` (`preferred_hospital_id`);

--
-- Indexes for table `donor_rewards`
--
ALTER TABLE `donor_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `donor_id` (`donor_id`),
  ADD KEY `tier_id` (`tier_id`);

--
-- Indexes for table `donor_tiers`
--
ALTER TABLE `donor_tiers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `educational_content`
--
ALTER TABLE `educational_content`
  ADD PRIMARY KEY (`content_id`);

--
-- Indexes for table `email_notifications_log`
--
ALTER TABLE `email_notifications_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sent_at` (`sent_at`);

--
-- Indexes for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  ADD PRIMARY KEY (`emergency_id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `fk_feedback_user` (`user_id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`hospital_id`),
  ADD KEY `fk_hospitals_user` (`user_id`);

--
-- Indexes for table `medical_verifications`
--
ALTER TABLE `medical_verifications`
  ADD PRIMARY KEY (`verification_id`),
  ADD KEY `donor_id` (`donor_id`),
  ADD KEY `mro_id` (`mro_id`);

--
-- Indexes for table `mro_officers`
--
ALTER TABLE `mro_officers`
  ADD PRIMARY KEY (`mro_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `otp_verification`
--
ALTER TABLE `otp_verification`
  ADD PRIMARY KEY (`otp_id`),
  ADD KEY `fk_otp_user` (`user_id`);

--
-- Indexes for table `partner_rewards`
--
ALTER TABLE `partner_rewards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  ADD PRIMARY KEY (`request_id`);

--
-- Indexes for table `reminder_settings`
--
ALTER TABLE `reminder_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD KEY `fk_reminder_settings_user` (`updated_by`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`reward_id`),
  ADD KEY `donor_id` (`donor_id`);

--
-- Indexes for table `reward_points_history`
--
ALTER TABLE `reward_points_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `donor_id` (`donor_id`),
  ADD KEY `donation_id` (`donation_id`),
  ADD KEY `achievement_id` (`achievement_id`);

--
-- Indexes for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `donor_id` (`donor_id`);

--
-- Indexes for table `success_stories`
--
ALTER TABLE `success_stories`
  ADD PRIMARY KEY (`story_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `donations`
--
ALTER TABLE `donations`
  MODIFY `donation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `donor_achievements`
--
ALTER TABLE `donor_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `donor_reminders`
--
ALTER TABLE `donor_reminders`
  MODIFY `reminder_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `donor_rewards`
--
ALTER TABLE `donor_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `donor_tiers`
--
ALTER TABLE `donor_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `educational_content`
--
ALTER TABLE `educational_content`
  MODIFY `content_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `email_notifications_log`
--
ALTER TABLE `email_notifications_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  MODIFY `emergency_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `otp_verification`
--
ALTER TABLE `otp_verification`
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `partner_rewards`
--
ALTER TABLE `partner_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `reminder_settings`
--
ALTER TABLE `reminder_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `reward_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reward_points_history`
--
ALTER TABLE `reward_points_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `blood_inventory`
--
ALTER TABLE `blood_inventory`
  ADD CONSTRAINT `blood_inventory_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

--
-- Constraints for table `donations`
--
ALTER TABLE `donations`
  ADD CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`),
  ADD CONSTRAINT `donations_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

--
-- Constraints for table `donation_requests`
--
ALTER TABLE `donation_requests`
  ADD CONSTRAINT `donation_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`),
  ADD CONSTRAINT `fk_donation_request_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE SET NULL;

--
-- Constraints for table `donors`
--
ALTER TABLE `donors`
  ADD CONSTRAINT `fk_donors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_preferred_hospital` FOREIGN KEY (`preferred_hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL;

--
-- Constraints for table `donor_reminders`
--
ALTER TABLE `donor_reminders`
  ADD CONSTRAINT `fk_donor_reminders_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_donor_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `donor_requests`
--
ALTER TABLE `donor_requests`
  ADD CONSTRAINT `donor_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `donor_requests_ibfk_2` FOREIGN KEY (`preferred_hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL;

--
-- Constraints for table `donor_rewards`
--
ALTER TABLE `donor_rewards`
  ADD CONSTRAINT `donor_rewards_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `donor_rewards_ibfk_2` FOREIGN KEY (`tier_id`) REFERENCES `donor_tiers` (`id`);

--
-- Constraints for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  ADD CONSTRAINT `emergency_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD CONSTRAINT `fk_hospitals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_verifications`
--
ALTER TABLE `medical_verifications`
  ADD CONSTRAINT `medical_verifications_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_verifications_ibfk_2` FOREIGN KEY (`mro_id`) REFERENCES `mro_officers` (`mro_id`) ON DELETE SET NULL;

--
-- Constraints for table `mro_officers`
--
ALTER TABLE `mro_officers`
  ADD CONSTRAINT `mro_officers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `mro_officers_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `otp_verification`
--
ALTER TABLE `otp_verification`
  ADD CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_settings`
--
ALTER TABLE `reminder_settings`
  ADD CONSTRAINT `fk_reminder_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `rewards`
--
ALTER TABLE `rewards`
  ADD CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE;

--
-- Constraints for table `reward_points_history`
--
ALTER TABLE `reward_points_history`
  ADD CONSTRAINT `reward_points_history_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reward_points_history_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reward_points_history_ibfk_3` FOREIGN KEY (`achievement_id`) REFERENCES `donor_achievements` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
