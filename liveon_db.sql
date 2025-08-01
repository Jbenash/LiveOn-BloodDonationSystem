-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 24, 2025 at 06:25 AM
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
(1, 'US004', 'Approved donor registration', 'donors', 'DN001', '2025-07-03 18:37:19');

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
('BLD4469', 'HS002', 'O-', 40, '2025-07-23 07:22:37'),
('BLD5131', 'HS002', 'AB-', 444, '2025-07-20 09:27:05'),
('BLD6722', 'HS004', 'O+', 30, '2025-07-23 05:13:45');

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
('REQ687b6b3', 'HS003', NULL, 'jhvkhbj', 'pending', '2025-07-19 09:53:54', 'DN6873e398'),
('REQ687b6b4', 'HS003', NULL, 'jknljn', 'pending', '2025-07-19 09:54:19', 'DN6873e398'),
('REQ687f4a8', 'HS001', NULL, 'we need your blood ', 'pending', '2025-07-22 08:23:38', NULL);

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
('DN001', 'US001', '1990-05-10', 'O+', '123 Main Street', 'Colombo', '2025-01-01 00:00:00.000', '2025-07-01', NULL, 3, 'available', NULL, NULL, 'HS001'),
('DN686a6923', 'US686a6923', '2025-07-18', 'B-', 'Trinco', 'trinco', '2025-07-10 00:00:00.000', NULL, NULL, 0, 'available', NULL, NULL, 'HS003'),
('DN68703e38', 'US68703e38', '2025-07-17', 'B-', 'kopay', 'kopay', '2025-07-13 23:02:38.243', NULL, NULL, 0, 'available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383730336533385f313735323332393830352e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383730336533385f323032352d30372d31325f31382d32392d32302e706466, NULL),
('DN68711744', 'US68711744', '2025-07-17', 'A+', 'neliyady', 'neliyady', '2025-07-19 13:49:55.081', NULL, NULL, 0, 'available', NULL, NULL, NULL),
('DN68727a8c', 'US68727a8c', '2025-07-31', 'B+', 'jaffna', 'jaffna', '2025-07-19 01:49:55.968', NULL, NULL, 20, 'available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383732376138635f313735323333373636352e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383732376138635f323032352d30372d31325f31382d32362d35382e706466, NULL),
('DN6873e398', 'US6873e398', '2025-07-24', 'AB-', 'kopay', 'kopay', '2025-07-20 14:57:02.094', NULL, NULL, 0, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383733653339385f313735323932303338322e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383733653339385f323032352d30372d31335f31392d32352d30362e706466, 'HS003'),
('DN6874b688', 'US6874b688', '2002-02-22', 'O+', 'sdfsdfdsfd', 'Ampara', '2025-07-23 13:15:38.697', NULL, '2025-07-14', 0, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383734623638385f313735333231313833372e706e67, NULL, 'HS001'),
('DN68788087', 'US68788087', '2002-02-22', NULL, 'sdfsdfdsfd', 'Mannar', '2025-07-19 10:02:10.000', NULL, '2025-07-13', 0, 'available', NULL, NULL, NULL),
('DN687d227f', 'US687d227f', '2002-02-22', 'O-', 'sdfsdfdsfd', 'Mannar', '2025-07-23 10:43:41.431', NULL, NULL, 0, 'not available', NULL, 0x443a5c4e657720666f6c6465725c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383764323237665f323032352d30372d32305f31392d33372d31352e706466, 'HS004'),
('DN68807b16', 'US68807b16', '2002-02-22', 'O+', 'Maharambaikulam', 'Vavuniya', '2025-07-23 13:16:44.758', NULL, NULL, 0, 'not available', NULL, 0x443a5c4e657720666f6c6465725c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383830376231365f323032352d30372d32335f30382d30352d30362e706466, 'HS001');

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
  `approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`feedback_id`, `user_id`, `role`, `message`, `approved`, `created_at`) VALUES
('FB001', 'US008', 'hospital', 'The donation process was smooth and staff were very helpful!', 1, '2025-07-10 05:15:00'),
('FB002', 'US0011', 'mro', 'The new dashboard really helps track donor information efficiently.', 1, '2025-07-11 04:00:00'),
('FB003', 'US007', 'hospital', 'We received emergency blood supply in time. Excellent coordination!', 1, '2025-07-12 09:50:00'),
('FB004', 'US001', 'donor', 'I would appreciate more updates about my donation impact.', 1, '2025-07-13 07:40:00'),
('FB005', 'US009', 'hospital', 'Can we have SMS alerts for donation eligibility renewals?', 1, '2025-07-13 12:10:00'),
('FB007', 'US0010', 'mro', 'Proud to be part of this platform. Blood saves lives!', 1, '2025-07-15 03:20:00');

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
('HS002', 'Kandy General Hospital', 'Kandy', 'info@kgh.lk', '0812345678', 'US0010'),
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
(1, 'US001', 'Your donation request has been sent.', 'info', 'unread', '2025-07-03 18:36:35'),
(2, 'US002', 'You have a new emergency request.', 'alert', 'unread', '2025-07-03 18:36:35'),
(3, 'US001', 'Your donation request has been sent.', 'info', 'read', '2025-07-03 18:36:36'),
(4, 'US002', 'You have a new emergency request.', 'alert', 'read', '2025-07-03 18:36:36'),
(5, 'US687d227f', 'New donor registered: sivatheevan ', 'info', 'unread', '2025-07-20 17:08:15'),
(9, 'US687d227f', 'Donor verified: DN687d227f', '', 'unread', '2025-07-20 17:37:15'),
(13, 'US004', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:28:56'),
(14, 'US005', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:28:56'),
(15, 'US006', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:28:56'),
(16, 'US004', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:33:52'),
(17, 'US005', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:33:52'),
(18, 'US006', 'Password reset requested for user: cst22075@std.uwu.ac.lk', '', 'read', '2025-07-21 17:33:52'),
(19, 'US004', 'User cst22075@std.uwu.ac.lk wants to change their password to: 123456', '', 'read', '2025-07-21 17:45:22'),
(20, 'US005', 'User cst22075@std.uwu.ac.lk wants to change their password to: 123456', '', 'unread', '2025-07-21 17:45:22'),
(21, 'US006', 'User cst22075@std.uwu.ac.lk wants to change their password to: 123456', '', 'unread', '2025-07-21 17:45:22'),
(22, 'US004', 'User cst22083@std.uwu.ac.lk wants to change their password to: 123456', '', 'unread', '2025-07-21 17:48:42'),
(23, 'US005', 'User cst22083@std.uwu.ac.lk wants to change their password to: 123456', '', 'unread', '2025-07-21 17:48:42'),
(24, 'US006', 'User cst22083@std.uwu.ac.lk wants to change their password to: 123456', '', 'unread', '2025-07-21 17:48:42'),
(25, 'US6874b688', 'New donation recorded: DON20250722185703341', '', 'unread', '2025-07-22 16:57:03'),
(26, 'US6874b688', 'New donation recorded: DON20250722191127254', '', 'unread', '2025-07-22 17:11:27'),
(27, 'US6874b688', 'New donation recorded: DON20250722201224457', '', 'unread', '2025-07-22 18:12:24'),
(28, 'US6874b688', 'New donation recorded: DON20250722202911549', '', 'unread', '2025-07-22 18:29:11'),
(29, 'US687d227f', 'New donation recorded: DON20250723070546951', '', 'unread', '2025-07-23 05:05:46'),
(30, 'US687d227f', 'New donation recorded: DON20250723071345288', '', 'unread', '2025-07-23 05:13:45'),
(32, 'US68807b16', 'New donor registered: Ben Asher', 'info', 'unread', '2025-07-23 06:03:02'),
(33, 'US68807b16', 'Donor verified: DN68807b16', '', 'unread', '2025-07-23 06:05:05'),
(34, 'US68807b16', 'New donation recorded: DON20250723092237613', '', 'unread', '2025-07-23 07:22:37'),
(35, 'US68807b16', 'New donation recorded: DON20250723094415425', '', 'unread', '2025-07-23 07:44:15'),
(36, 'US6874b688', 'New donation recorded: DON20250723094544194', '', 'unread', '2025-07-23 07:45:44'),
(37, 'US68807b16', 'New donation recorded: DON20250723094650363', '', 'unread', '2025-07-23 07:46:50');

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
(24, 'US68703e38', '132420', '2025-07-11 00:37:04', 1, '2025-07-10 22:27:04', '2025-07-11 03:57:28'),
(25, 'US68711744', '538653', '2025-07-11 16:03:08', 1, '2025-07-11 13:53:08', '2025-07-11 19:24:07'),
(28, 'US68727a8c', '978853', '2025-07-12 17:19:00', 0, '2025-07-12 15:09:00', NULL),
(29, 'US6873e398', '108415', '2025-07-13 18:59:28', 0, '2025-07-13 16:49:28', NULL),
(32, 'US6874b688', '496150', '2025-07-14 09:59:28', 1, '2025-07-14 07:49:28', '2025-07-14 13:19:52'),
(33, 'US68788087', '978773', '2025-07-17 06:58:07', 1, '2025-07-17 04:48:07', '2025-07-17 10:19:24'),
(35, 'US687d227f', '217426', '2025-07-20 19:18:15', 1, '2025-07-20 17:08:15', '2025-07-20 22:38:39'),
(37, 'US68807b16', '637235', '2025-07-23 08:13:02', 1, '2025-07-23 06:03:02', '2025-07-23 11:34:08');

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
(1, 'US006', '123456', 'pending', '2025-07-21 17:13:03', NULL),
(2, 'US686d589f', '123456', 'pending', '2025-07-21 17:21:26', NULL),
(3, 'US686d589f', '123456', 'pending', '2025-07-21 17:21:52', NULL),
(4, 'US686d589f', '123456', 'pending', '2025-07-21 17:28:56', NULL),
(5, 'US686d589f', '123456', 'pending', '2025-07-21 17:33:52', NULL),
(6, 'US686d589f', '123456', 'pending', '2025-07-21 17:45:22', NULL),
(7, 'US687d227f', '123456', 'pending', '2025-07-21 17:48:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `reward_id` int(11) NOT NULL,
  `donor_id` varchar(10) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `badge` varchar(50) DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rewards`
--

INSERT INTO `rewards` (`reward_id`, `donor_id`, `points`, `badge`, `last_updated`) VALUES
(1, 'DN001', 150, 'Silver Donor', '2025-07-03 18:36:47');

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
('US001', 'Donor One', 'donor1@example.com', '0771234567', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'donor', 'active'),
('US0010', 'Kandy Hospital MRO', 'mro@kandy.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US0011', 'Colombo Hospital MRO', 'mro@colombo.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US002', 'MRO Officer', 'mro@badulla.com', '0778765432', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'mro', 'active'),
('US003', 'National Hospital', 'hospital@badulla.com', '0779999999', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'hospital', 'active'),
('US004', 'Admin User', 'admin@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US005', 'Admin User', 'admin123@liveon.lk', '0770000000', '$2y$10$uGnE0dhpLSE7FqfnhdNZPuWiXdKReWApkd90S1DM54qWwz2kLiapGi', 'admin', 'active'),
('US006', 'Admin User', 'admin234@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US007', 'District General Hospital Jaffna', 'hospital@jaffna.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'hospital', 'active'),
('US008', 'District General Hospital Colombo', 'hospital@colombo.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'hospital', 'active'),
('US009', 'Jaffna Hospital MRO', 'mro@jaffna.com', '123456', '$2y$10$wIe1AymkOLPr47n1hRma3eB9mRnS3hBaWGw47oSbGBX/M8kc0PL4u', 'mro', 'active'),
('US686a6923', 'nilaxsan', 'nilaksh2001@gmail.com', '0776104689', '$2y$10$BSRlvXgaK74oq2Mvn72E5ODQHWsOv1l4rLPJIb3yEx2tR6iq4eINm', 'donor', 'inactive'),
('US68703e38', 'Vishnu', 'cst22098@std.uwu.ac.lk', '0778799422', '$2y$10$aIdhDU/VwXNMSvOTSjiAH./iXJwdt24d1zroKhBomPSZqUZoHaQji', 'donor', 'inactive'),
('US68711744', 'abinath', 'abinath157@gmail.com', '0741814245', '$2y$10$md0ER0hkvd1V9bZ6bHdC4.p6iqiNnEGOLQECmY6rrAoK515L5xkVa', 'donor', 'inactive'),
('US68727a8c', 'Abiramy', 'abinathan1123@gmail.com', '0778200752', '$2y$10$l6yBPRV.svOcQa3.kW/1wuqyVfowXUejIWjsuTkNsNr6n.UAo7Yp2', 'donor', 'inactive'),
('US6873e398', 'Mathangey', 'cst22081@std.uwu.ac.lk', '0778200752', '$2y$10$kRo38.tsl.yQjWWPV/Ca1OUU43E/gzjtSxoYT7LHltE8Ve/djsQEO', 'donor', 'inactive'),
('US6874b688', 'Nuha', 'cst22069@std.uwu.ac.lk', '0757553132', '$2y$10$F.U3BMoSiie7oNVRx9GbveMccIJh5caI691X.4b/TzBs2zx/QEGWS', 'donor', 'inactive'),
('US68788087', 'tharsan ', 'cst22076@std.uwu.ac.lk', '123456', '$2y$10$BjLvNMRR1o7NsdcepsFzwuQnSIktjxLGsgvzmDkYMKNY7awgbMLk.', 'donor', 'inactive'),
('US687d227f', 'sivatheevan', 'cst22083@std.uwu.ac.lk', '1234567891', '$2y$10$ywKCK54OAmHACe05SeZeVue2BvNxntSTqaPFpoHjb.IEbYwwMqnVa', 'donor', 'inactive'),
('US68807b16', 'Ben Asher', 'mbenash961030@gmail.com', '0760312229', '$2y$10$TcMVQtRKa0B12jzhE/ahS.rmQOsiTceMH4Q79eUQ.Y/DWyg1pBWZq', 'donor', 'inactive');

-- Reward System Tables

-- Donor Tiers Table
CREATE TABLE donor_tiers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tier_name VARCHAR(50) NOT NULL,
    tier_level INT NOT NULL,
    min_donations INT NOT NULL,
    badge_icon VARCHAR(255),
    discount_percentage DECIMAL(5,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donor Achievements Table
CREATE TABLE donor_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_type ENUM('milestone', 'special', 'consistency', 'emergency') NOT NULL,
    trigger_condition VARCHAR(255) NOT NULL,
    badge_icon VARCHAR(255),
    points_reward INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donor Rewards Table
CREATE TABLE donor_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(50) NOT NULL,
    tier_id INT,
    current_points INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    total_points_spent INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_donation_date DATE,
    achievements_earned JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES donor_tiers(id)
);

-- Reward Points History Table
CREATE TABLE reward_points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(50) NOT NULL,
    points_earned INT NOT NULL,
    points_spent INT DEFAULT 0,
    transaction_type ENUM('earned', 'spent', 'bonus', 'penalty') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    donation_id VARCHAR(50),
    achievement_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (donation_id) REFERENCES donations(donation_id) ON DELETE SET NULL,
    FOREIGN KEY (achievement_id) REFERENCES donor_achievements(id) ON DELETE SET NULL
);

-- Reward Redemptions Table
CREATE TABLE reward_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(50) NOT NULL,
    redemption_type VARCHAR(100) NOT NULL,
    points_spent INT NOT NULL,
    redemption_value DECIMAL(10,2),
    status ENUM('pending', 'approved', 'redeemed', 'expired') DEFAULT 'pending',
    redemption_code VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE
);

-- Partner Rewards Table
CREATE TABLE partner_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partner_name VARCHAR(100) NOT NULL,
    partner_type ENUM('hospital', 'restaurant', 'hotel', 'travel', 'health') NOT NULL,
    reward_description TEXT,
    discount_percentage DECIMAL(5,2),
    points_required INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default donor tiers
INSERT INTO donor_tiers (tier_name, tier_level, min_donations, badge_icon, discount_percentage, description) VALUES
('Bronze Donor', 1, 1, '🥉', 10.00, 'Beginner donor with basic benefits'),
('Silver Donor', 2, 6, '🥈', 15.00, 'Regular donor with enhanced benefits'),
('Gold Donor', 3, 16, '🥇', 20.00, 'Experienced donor with premium benefits'),
('Platinum Donor', 4, 31, '💎', 25.00, 'Elite donor with exclusive benefits');

-- Insert default achievements
INSERT INTO donor_achievements (achievement_name, achievement_type, trigger_condition, badge_icon, points_reward, description) VALUES
('First Donation', 'milestone', 'donation_count >= 1', '🎯', 100, 'Completed your first donation'),
('Life Saver', 'special', 'emergency_donation = true', '🏥', 200, 'Made an emergency donation'),
('Consistency Champion', 'consistency', 'streak >= 12', '📈', 500, '12 consecutive months of donations'),
('Emergency Hero', 'emergency', 'emergency_response = true', '🚨', 150, 'Responded to emergency call'),
('Weekend Warrior', 'special', 'weekend_donation = true', '⚡', 125, 'Donated on weekend'),
('Holiday Hero', 'special', 'holiday_donation = true', '🎄', 125, 'Donated on holiday'),
('10th Donation', 'milestone', 'donation_count >= 10', '🔟', 200, 'Completed 10 donations'),
('50th Donation', 'milestone', 'donation_count >= 50', '5️⃣0️⃣', 500, 'Completed 50 donations'),
('100th Donation', 'milestone', 'donation_count >= 100', '💯', 1000, 'Completed 100 donations');

-- Insert default partner rewards
INSERT INTO partner_rewards (partner_name, partner_type, reward_description, discount_percentage, points_required) VALUES
('General Hospital', 'hospital', 'Health checkup voucher', NULL, 500),
('City Restaurant', 'restaurant', 'Dining voucher', 15.00, 1000),
('Grand Hotel', 'hotel', 'Hotel stay voucher', 20.00, 2000),
('Travel Agency', 'travel', 'Travel voucher', 25.00, 5000);

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
-- Indexes for table `educational_content`
--
ALTER TABLE `educational_content`
  ADD PRIMARY KEY (`content_id`);

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
-- Indexes for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  ADD PRIMARY KEY (`request_id`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`reward_id`),
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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `donations`
--
ALTER TABLE `donations`
  MODIFY `donation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `educational_content`
--
ALTER TABLE `educational_content`
  MODIFY `content_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  MODIFY `emergency_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `otp_verification`
--
ALTER TABLE `otp_verification`
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `password_reset_requests`
--
ALTER TABLE `password_reset_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `reward_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- Constraints for table `rewards`
--
ALTER TABLE `rewards`
  ADD CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
