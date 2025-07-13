-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 13, 2025 at 02:49 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

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
('4', 'HS001', 'A+', 20, '2025-07-03 18:21:09'),
('5', 'HS001', 'O+', 15, '2025-07-03 18:21:09'),
('6', 'HS002', 'B-', 10, '2025-07-03 18:21:09');

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
(11, 'DN686d589f', 'HS002', 'A+', NULL, 2),
(38, 'DN68703e38', 'HS002', 'A+', '2025-07-10', 44),
(39, 'DN686d589f', 'HS002', 'A+', '2025-07-11', 55),
(40, 'DN68711744', 'HS002', 'A+', '2025-07-11', 400),
(41, 'DN686d589f', 'HS002', 'B-', '2025-07-12', 78),
(42, 'DN68722f60', 'HS002', 'A-', '2025-07-13', 400),
(43, 'DN68722f60', 'HS002', 'A-', '2025-07-13', 1),
(44, 'DN68727a8c', 'HS002', 'B+', '2025-07-13', 400);

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
('DR004', 'HS002', 'AB-', 'Rare blood needed for child in ICU', 'pending', '2025-07-03 18:34:34', NULL);

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
  `last_donation_date` date DEFAULT NULL,
  `donation_eligibility` date DEFAULT NULL,
  `lives_saved` int(11) DEFAULT 0,
  `status` enum('available','not available') DEFAULT 'not available',
  `donor_image` longblob DEFAULT NULL,
  `donor_card` longblob DEFAULT NULL,
  `preferred_hospital_id` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`donor_id`, `user_id`, `dob`, `blood_type`, `address`, `city`, `last_donation_date`, `donation_eligibility`, `lives_saved`, `status`, `donor_image`, `donor_card`, `preferred_hospital_id`) VALUES
('DN001', 'US001', '1990-05-10', 'O+', '123 Main Street', 'Colombo', '2025-01-01', '2025-07-01', 3, 'available', NULL, NULL, NULL),
('DN686a6923', 'US686a6923', '2025-07-18', 'B-', 'Trinco', 'trinco', '2025-07-10', NULL, 0, 'not available', NULL, NULL, NULL),
('DN686d589f', 'US686d589f', '2025-07-18', 'B+', 'vavuniya', 'jaffna vavuniya', '2025-07-12', NULL, 0, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383664353839665f313735323335323534322e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383664353839665f323032352d30372d31325f30392d33322d33342e706466, NULL),
('DN68703e38', 'US68703e38', '2025-07-17', 'B-', 'kopay', 'kopay', '2025-07-11', NULL, 0, 'available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383730336533385f313735323332393830352e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383730336533385f323032352d30372d31325f31382d32392d32302e706466, NULL),
('DN68711744', 'US68711744', '2025-07-17', 'A+', 'neliyady', 'neliyady', '2025-07-11', NULL, 0, 'not available', NULL, NULL, NULL),
('DN68722f60', 'US68722f60', '2025-07-25', 'A-', 'vaddukoddai', 'vaddukoddai', '2025-07-13', NULL, 10, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383732326636305f313735323332393035372e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383732326636305f323032352d30372d31325f31312d35312d31302e706466, NULL),
('DN68727a8c', 'US68727a8c', '2025-07-31', 'B+', 'jaffna', 'jaffna', '2025-07-13', NULL, 20, 'not available', 0x75706c6f6164732f646f6e6f725f696d616765732f646f6e6f725f444e36383732376138635f313735323333373636352e6a7067, 0x433a5c78616d70705c6874646f63735c4c6976656f6e76325c6261636b656e645f6170692f75706c6f6164732f646f6e6f725f63617264732f646f6e6f725f636172645f444e36383732376138635f323032352d30372d31325f31382d32362d35382e706466, NULL);

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
(1, 'HS001', 'O+', 5, '', '2025-07-03 18:36:20');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `role` enum('donor','hospital','mro','admin') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`feedback_id`, `user_id`, `role`, `message`, `created_at`) VALUES
('', 'US68722f60', 'donor', 'wwwww', '2025-07-13 12:49:11');

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
('HS001', 'National Hospital', 'Colombo', 'contact@nhsl.lk', '0112345678', 'US003'),
('HS002', 'Kandy General Hospital', 'Kandy', 'info@kgh.lk', '0812345678', NULL);

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
) ;

--
-- Dumping data for table `medical_verifications`
--

INSERT INTO `medical_verifications` (`verification_id`, `donor_id`, `age`, `mro_id`, `height_cm`, `weight_kg`, `medical_history`, `doctor_notes`, `verification_date`) VALUES
('MV00e915eb', 'DN68722f60', 25, 'MRO001', 170.00, 70.00, 'good', 'good', '2025-07-11 18:30:00'),
('MV7a905803', 'DN68711744', NULL, 'MRO001', 170.00, 70.00, 'good', 'good', '2025-07-10 18:30:00'),
('MVcd1d0573', 'DN68727a8c', 23, 'MRO001', 170.00, 70.00, 'good', 'good', '2025-07-11 18:30:00'),
('MVd60012c0', 'DN68703e38', NULL, 'MRO001', 170.00, 70.00, 'a', 'a', '2025-07-11 18:30:00'),
('MVf91ba910', 'DN686d589f', 47, 'MRO001', 170.00, 70.00, 'good', 'good', '2025-07-11 18:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `mro_officers`
--

CREATE TABLE `mro_officers` (
  `mro_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mro_officers`
--

INSERT INTO `mro_officers` (`mro_id`, `user_id`, `hospital_id`, `designation`) VALUES
('MRO001', 'US002', 'HS001', 'Senior MRO');

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
(3, 'US001', 'Your donation request has been sent.', 'info', 'unread', '2025-07-03 18:36:36'),
(4, 'US002', 'You have a new emergency request.', 'alert', 'unread', '2025-07-03 18:36:36');

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
(21, 'US686d589f', '581049', '2025-07-08 19:52:55', 0, '2025-07-08 17:42:55', '2025-07-08 23:13:19'),
(24, 'US68703e38', '132420', '2025-07-11 00:37:04', 1, '2025-07-10 22:27:04', '2025-07-11 03:57:28'),
(25, 'US68711744', '538653', '2025-07-11 16:03:08', 1, '2025-07-11 13:53:08', '2025-07-11 19:24:07'),
(27, 'US68722f60', '339019', '2025-07-12 11:58:16', 1, '2025-07-12 09:48:16', '2025-07-12 15:18:33'),
(28, 'US68727a8c', '978853', '2025-07-12 17:19:00', 0, '2025-07-12 15:09:00', NULL);

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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('donor','mro','hospital','admin') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `phone`, `password_hash`, `role`, `status`) VALUES
('US001', 'Donor One', 'donor1@example.com', '0771234567', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'donor', 'inactive'),
('US002', 'MRO Officer', 'mro1@example.com', '0778765432', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'mro', 'active'),
('US003', 'National Hospital', 'hospital@example.com', '0779999999', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'hospital', 'active'),
('US004', 'Admin User', 'admin@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US005', 'Admin User', 'admin123@liveon.lk', '0770000000', '$2y$10$uGnE0dhpLSE7FqfnhdNZPuWiXdKReWApkd90S1DM54qWwz2kLiapGi', 'admin', 'active'),
('US006', 'Admin User', 'admin234@liveon.lk', '0770000000', '$2y$10$JRi8cOu0JhEk5DRcwOz.4.m3dIWAgxcbxqeb8Ast9/nqlYvrerbCW', 'admin', 'active'),
('US686a6923', 'nilaxsan', 'nilaksh2001@gmail.com', '0776104689', '$2y$10$BSRlvXgaK74oq2Mvn72E5ODQHWsOv1l4rLPJIb3yEx2tR6iq4eINm', 'donor', 'inactive'),
('US686d589f', 'Ben asar', 'cst22075@std.uwu.ac.lk', '0776104689', '$2y$10$1NObhIKpex8XCVqeCa2y4.4bogtGHmJkCa7.Qp/wnaJ/g5ssm7dMS', 'donor', 'active'),
('US68703e38', 'Vishnu', 'cst22098@std.uwu.ac.lk', '0778799422', '$2y$10$aIdhDU/VwXNMSvOTSjiAH./iXJwdt24d1zroKhBomPSZqUZoHaQji', 'donor', 'active'),
('US68711744', 'abinath', 'abinath157@gmail.com', '0741814245', '$2y$10$md0ER0hkvd1V9bZ6bHdC4.p6iqiNnEGOLQECmY6rrAoK515L5xkVa', 'donor', 'active'),
('US68722f60', 'lavakeesan', 'lavakeesh@gmail.com', '0776104689', '$2y$10$zXmnlgbbziLvUVVZYaNVFuv38BJOhxsqeCgQe54s3qQ.m1eEo0NBu', 'donor', 'active'),
('US68727a8c', 'Abiramy', 'abinathan1123@gmail.com', '0778200752', '$2y$10$l6yBPRV.svOcQa3.kW/1wuqyVfowXUejIWjsuTkNsNr6n.UAo7Yp2', 'donor', 'active');

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
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`reward_id`),
  ADD KEY `donor_id` (`donor_id`);

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
  MODIFY `donation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `educational_content`
--
ALTER TABLE `educational_content`
  MODIFY `content_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  MODIFY `emergency_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `otp_verification`
--
ALTER TABLE `otp_verification`
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

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
