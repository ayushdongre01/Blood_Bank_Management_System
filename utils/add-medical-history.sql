USE bloodbank_db;

-- Add medical_history column to recipient table
ALTER TABLE recipient
ADD COLUMN medical_history TEXT AFTER receiver_type; 