-- Add profile_image column to donors table if it doesn't exist
ALTER TABLE donors
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL;

-- Add profile_image column to hospital table if it doesn't exist
ALTER TABLE hospital
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL; 