-- Add approved column to feedback table
ALTER TABLE `feedback` ADD COLUMN `approved` tinyint(1) DEFAULT 0;

-- Update existing feedback records to be approved (since they were already visible)
UPDATE `feedback` SET `approved` = 1 WHERE `approved` IS NULL OR `approved` = 0; 