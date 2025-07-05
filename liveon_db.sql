-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 03, 2025 at 08:37 PM
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
  `inventory_id` int(11) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `units_available` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_inventory`
--

INSERT INTO `blood_inventory` (`inventory_id`, `hospital_id`, `blood_type`, `units_available`, `last_updated`) VALUES
(4, 'HS001', 'A+', 20, '2025-07-03 18:21:09'),
(5, 'HS001', 'O+', 15, '2025-07-03 18:21:09'),
(6, 'HS002', 'B-', 10, '2025-07-03 18:21:09');

-- --------------------------------------------------------

--
-- Table structure for table `donations`
--

CREATE TABLE `donations` (
  `donation_id` int(11) NOT NULL,
  `donor_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `date` date DEFAULT NULL,
  `units_donated` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donations`
--

INSERT INTO `donations` (`donation_id`, `donor_id`, `hospital_id`, `blood_type`, `date`, `units_donated`) VALUES
(2, 'DN001', 'HS001', 'O+', '2025-01-01', 1);

-- --------------------------------------------------------

--
-- Table structure for table `donation_requests`
--

CREATE TABLE `donation_requests` (
  `request_id` varchar(10) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `units_required` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','fulfilled','cancelled') DEFAULT 'pending',
  `request_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donation_requests`
--

INSERT INTO `donation_requests` (`request_id`, `hospital_id`, `blood_type`, `units_required`, `reason`, `status`, `request_date`) VALUES
('DR001', 'HS001', 'O+', 5, 'Accident emergency case requiring urgent blood', 'pending', '2025-07-03 18:34:34'),
('DR002', 'HS002', 'A-', 3, 'Surgery scheduled for tomorrow', 'pending', '2025-07-03 18:34:34'),
('DR003', 'HS001', 'B+', 2, 'Patient with anemia requires transfusion', 'fulfilled', '2025-07-02 18:34:34'),
('DR004', 'HS002', 'AB-', 1, 'Rare blood needed for child in ICU', 'pending', '2025-07-03 18:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

CREATE TABLE `donors` (
  `donor_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `last_donation_date` date DEFAULT NULL,
  `donation_eligibility` date DEFAULT NULL,
  `lives_saved` int(11) DEFAULT 0,
  `status` enum('pending','approved') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`donor_id`, `user_id`, `dob`, `blood_type`, `address`, `city`, `last_donation_date`, `donation_eligibility`, `lives_saved`, `status`) VALUES
('DN001', 'US001', '1990-05-10', 'O+', '123 Main Street', 'Colombo', '2025-01-01', '2025-07-01', 3, 'pending'),
('DN68669c89', 'US68669c89', '2002-02-22', 'A+', 'Vavuniya', 'Vavuniya', NULL, NULL, 0, 'pending'),
('DN6866a3e1', 'US6866a3e1', '2002-02-22', 'A+', 'Vavuniya', 'Vavuniya', NULL, NULL, 0, 'pending'),
('DN6866a7ff', 'US6866a7ff', '2002-02-22', 'A+', 'Vavuniya', 'Vavuniya', NULL, NULL, 0, 'pending');

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
  `status` enum('pending','fulfilled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_requests`
--

INSERT INTO `emergency_requests` (`emergency_id`, `hospital_id`, `blood_type`, `required_units`, `status`, `created_at`) VALUES
(1, 'HS001', 'O+', 5, 'pending', '2025-07-03 18:36:20');

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `hospital_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`hospital_id`, `name`, `location`, `contact_email`, `contact_phone`) VALUES
('HS001', 'National Hospital', 'Colombo', 'contact@nhsl.lk', '0112345678'),
('HS002', 'Kandy General Hospital', 'Kandy', 'info@kgh.lk', '0812345678');

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
(4, 'US68669c89', '307665', '2025-07-03 17:16:49', 127, '2025-07-03 15:06:49', NULL),
(5, 'US6866a3e1', '342208', '2025-07-03 17:48:09', 127, '2025-07-03 15:38:09', NULL),
(6, 'US6866a7ff', '797242', '2025-07-03 18:05:43', 127, '2025-07-03 15:55:43', NULL);

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
  `status` enum('pending','active','inactive') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `phone`, `password_hash`, `role`, `status`) VALUES
('US001', 'Donor One', 'donor1@example.com', '0771234567', '$2y$10$W3jQk2XgEt9Qxo5QnFgZReUJcH7q8hvVY2c9mD07ZyulVK2cIdQeC', 'donor', 'pending'),
('US002', 'MRO Officer', 'mro1@example.com', '0778765432', '$2y$10$Zj4m8Y9nK7fKmWzZp1shIu.ePflA4X5gU4EcKxYfbYxDRyIhsvW2i', 'mro', 'pending'),
('US003', 'Hospital Staff', 'hospital@example.com', '0779999999', '$2y$10$7TJvJzED9QtzRrS9myuhX.gyq4MYZy5v8T.kl7OEIKGbQVO38l5Xy', 'hospital', 'active'),
('US004', 'Admin User', 'admin@liveon.lk', '0770000000', '$2y$10$MLP2mkzzxD8f3ZUPwMGcR.TnlAlU3bz0n6HLuDULMoChUqFUVHFti', 'admin', 'active'),
('US68669c89', 'Ben Asher', 'mbenash961030@gmail.com', 'dfsdf', '$2y$10$5D.z48ocUGFZm4W9cgFsj.JQTJN.SM6u6XlS74b96eMB4J8qbCUDa', 'donor', 'pending'),
('US6866a3e1', 'Ben Asher', 'jbenash0729@gmail.com', '4546547', '$2y$10$mePS9scLI0wj5m9k1pddSOstH1i7vaHV3j7kzYfcS.4smc1kRaZAO', 'donor', 'pending'),
('US6866a7ff', 'Ben Asher', 'cst22075@std.uwu.ac.lk', '1234555', '$2y$10$Xt7Bk0gfIyl.mQBaRsnaDeM5PIzbFqKhxpxqBH0z9gnlMvKKwfFwm', 'donor', 'pending');

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
  ADD PRIMARY KEY (`inventory_id`),
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
  ADD KEY `hospital_id` (`hospital_id`);

--
-- Indexes for table `donors`
--
ALTER TABLE `donors`
  ADD PRIMARY KEY (`donor_id`),
  ADD KEY `fk_donors_user` (`user_id`);

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
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`hospital_id`);

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
-- AUTO_INCREMENT for table `blood_inventory`
--
ALTER TABLE `blood_inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `donations`
--
ALTER TABLE `donations`
  MODIFY `donation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  ADD CONSTRAINT `donation_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

--
-- Constraints for table `donors`
--
ALTER TABLE `donors`
  ADD CONSTRAINT `fk_donors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  ADD CONSTRAINT `emergency_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`);

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
