-- LiveOn Database Tables Creation Script
-- Execute in this exact order to avoid foreign key errors

-- ===========================================
-- PHASE 1: INDEPENDENT TABLES (No Dependencies)
-- ===========================================

-- 1. Users table (base for all user types)
CREATE TABLE `users` (
  `user_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('donor','mro','hospital','admin') NOT NULL,
  `status` enum('active','inactive','rejected') DEFAULT 'inactive',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Hospitals table
CREATE TABLE `hospitals` (
  `hospital_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`hospital_id`),
  KEY `fk_hospitals_user` (`user_id`),
  CONSTRAINT `fk_hospitals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Admin logs table
CREATE TABLE `admin_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(10) DEFAULT NULL,
  `action` text DEFAULT NULL,
  `target_table` varchar(50) DEFAULT NULL,
  `target_id` varchar(10) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Educational content table
CREATE TABLE `educational_content` (
  `content_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` enum('article','tip','faq') DEFAULT 'article',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Success stories table
CREATE TABLE `success_stories` (
  `story_id` varchar(10) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`story_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Password reset requests table
CREATE TABLE `password_reset_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `requested_password` varchar(255) NOT NULL,
  `status` enum('pending','completed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================================
-- PHASE 2: TABLES WITH SINGLE DEPENDENCIES
-- ===========================================

-- 7. Donors table (depends on users and hospitals)
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
  `preferred_hospital_id` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`donor_id`),
  KEY `fk_donors_user` (`user_id`),
  KEY `fk_preferred_hospital` (`preferred_hospital_id`),
  CONSTRAINT `fk_donors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_preferred_hospital` FOREIGN KEY (`preferred_hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. MRO Officers table (depends on users and hospitals)
CREATE TABLE `mro_officers` (
  `mro_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`mro_id`),
  KEY `user_id` (`user_id`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `mro_officers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `mro_officers_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. Blood inventory table (depends on hospitals)
CREATE TABLE `blood_inventory` (
  `blood_id` varchar(10) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  `units_available` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`blood_id`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `blood_inventory_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. OTP verification table (depends on users)
CREATE TABLE `otp_verification` (
  `otp_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) DEFAULT NULL,
  `otp_code` varchar(10) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `fk_otp_user` (`user_id`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. Notifications table (depends on users)
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('info','request','reminder','alert') DEFAULT 'info',
  `status` enum('unread','read') DEFAULT 'unread',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 12. Feedback table (depends on users)
CREATE TABLE `feedback` (
  `feedback_id` varchar(10) NOT NULL,
  `user_id` varchar(10) DEFAULT NULL,
  `role` enum('donor','hospital','mro','admin') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`feedback_id`),
  KEY `fk_feedback_user` (`user_id`),
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================================
-- PHASE 3: TABLES WITH MULTIPLE DEPENDENCIES
-- ===========================================

-- 13. Donations table (depends on donors and hospitals)
CREATE TABLE `donations` (
  `donation_id` int(11) NOT NULL AUTO_INCREMENT,
  `donor_id` varchar(10) DEFAULT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `donation_date` date DEFAULT NULL,
  `units_donated` int(11) DEFAULT 1,
  PRIMARY KEY (`donation_id`),
  KEY `donor_id` (`donor_id`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`),
  CONSTRAINT `donations_ibfk_2` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 14. Donation requests table (depends on hospitals and donors)
CREATE TABLE `donation_requests` (
  `request_id` varchar(10) NOT NULL,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','fulfilled','cancelled') DEFAULT 'pending',
  `request_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `donor_id` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `hospital_id` (`hospital_id`),
  KEY `fk_donation_request_donor` (`donor_id`),
  CONSTRAINT `donation_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`),
  CONSTRAINT `fk_donation_request_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 15. Emergency requests table (depends on hospitals)
CREATE TABLE `emergency_requests` (
  `emergency_id` int(11) NOT NULL AUTO_INCREMENT,
  `hospital_id` varchar(10) DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `required_units` int(11) DEFAULT NULL,
  `status` enum('critical','normal') DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`emergency_id`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `emergency_requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 16. Medical verifications table (depends on donors and mro_officers)
CREATE TABLE `medical_verifications` (
  `verification_id` varchar(10) NOT NULL,
  `donor_id` varchar(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `mro_id` varchar(10) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `doctor_notes` text DEFAULT NULL,
  `verification_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`verification_id`),
  KEY `donor_id` (`donor_id`),
  KEY `mro_id` (`mro_id`),
  CONSTRAINT `medical_verifications_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE,
  CONSTRAINT `medical_verifications_ibfk_2` FOREIGN KEY (`mro_id`) REFERENCES `mro_officers` (`mro_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 17. Rewards table (depends on donors)
CREATE TABLE `rewards` (
  `reward_id` int(11) NOT NULL AUTO_INCREMENT,
  `donor_id` varchar(10) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `badge` varchar(50) DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`reward_id`),
  KEY `donor_id` (`donor_id`),
  CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================================
-- PHASE 4: REWARD SYSTEM TABLES (Optional)
-- ===========================================

-- 18. Donor tiers table (independent)
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

-- 19. Donor achievements table (independent)
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

-- 20. Donor rewards table (depends on donors and donor_tiers)
CREATE TABLE donor_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(10) NOT NULL,
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

-- 21. Reward points history table (depends on donors, donations, and donor_achievements)
CREATE TABLE reward_points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(10) NOT NULL,
    points_earned INT NOT NULL,
    points_spent INT DEFAULT 0,
    transaction_type ENUM('earned', 'spent', 'bonus', 'penalty') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    donation_id INT,
    achievement_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (donation_id) REFERENCES donations(donation_id) ON DELETE SET NULL,
    FOREIGN KEY (achievement_id) REFERENCES donor_achievements(id) ON DELETE SET NULL
);

-- 22. Reward redemptions table (depends on donors)
CREATE TABLE reward_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id VARCHAR(10) NOT NULL,
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

-- 23. Partner rewards table (independent)
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

-- ===========================================
-- TRIGGERS (Create after all tables exist)
-- ===========================================

-- Blood inventory update trigger
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
END$$
DELIMITER ;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

SELECT 'All tables created successfully in the correct order!' AS message;
