USE bloodbank_db;

-- Add priority column to blood_requests table if it doesn't exist
ALTER TABLE blood_requests
ADD COLUMN priority VARCHAR(50) AFTER required_date;

-- Add receiver_type column to recipient table if it doesn't exist
ALTER TABLE recipient
ADD COLUMN receiver_type VARCHAR(50) AFTER email; 