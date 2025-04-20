-- Create the database
CREATE DATABASE IF NOT EXISTS bloodbank_db;
USE bloodbank_db;

-- Drop tables if they exist
DROP TABLE IF EXISTS transfusion, blood_requests, blood_inventory, donation, tests_screening, donors, recipient, staff, hospital, blood_donation_campaigns;

-- 1. Donors Table
CREATE TABLE donors (
    donor_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    blood_type VARCHAR(5),
    address VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    contact_no VARCHAR(15),
    donation_date DATE
);

-- 2. Tests_Screening Table
CREATE TABLE tests_screening (
    screening_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT,
    test_result VARCHAR(50),
    notes TEXT,
    test_date DATE,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE
);

-- 3. Staff Table
CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),
    email VARCHAR(100),
    contact_no VARCHAR(15),
    hiring_date DATE
);

-- 4. Donation Table
CREATE TABLE donation (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT,
    screening_id INT,
    staff_id INT,
    donation_date DATE,
    volume_donated FLOAT,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (screening_id) REFERENCES tests_screening(screening_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);

-- 5. Blood_Donation_Campaigns Table
CREATE TABLE blood_donation_campaigns (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(100),
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    organizer VARCHAR(100),
    amount_collected FLOAT
);

-- 6. Blood_Inventory Table
CREATE TABLE blood_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    blood_type VARCHAR(5),
    components VARCHAR(100),
    quantity_available FLOAT,
    expiration_date DATE,
    current_status VARCHAR(50),
    campaign_id INT,
    FOREIGN KEY (campaign_id) REFERENCES blood_donation_campaigns(campaign_id)
);

-- 7. Recipient Table
CREATE TABLE recipient (
    recipient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    blood_type VARCHAR(5),
    address VARCHAR(255),
    email VARCHAR(100),
    contact_no VARCHAR(15),
    receiver_type VARCHAR(50)
);

-- 8. Hospital Table
CREATE TABLE hospital (
    hospital_id INT PRIMARY KEY,
    hospital_name VARCHAR(100),
    hospital_address VARCHAR(255),
    email VARCHAR(100),
    contact_no VARCHAR(15)
);

-- 9. Blood_Requests Table
CREATE TABLE blood_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT,
    hospital_id INT,
    blood_type VARCHAR(5),
    amount_required FLOAT,
    request_date DATE,
    request_status VARCHAR(50),
    FOREIGN KEY (recipient_id) REFERENCES recipient(recipient_id),
    FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id)
);

-- 10. Transfusion Table
CREATE TABLE transfusion (
    transfusion_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    transfused_by INT,
    transfusion_date DATE,
    FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
    FOREIGN KEY (transfused_by) REFERENCES staff(staff_id)
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'donor', 'hospital', 'staff') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Insert Admin User
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@bloodbank.com', '$2b$10$2a1KkT8iggDWFRtNr/hkLO1/EfO2YYKelB5ZQnpNMsqJo5jEhPuL.', 'admin')
ON DUPLICATE KEY UPDATE username = 'admin';

-- Insert Additional Admin User with password detox@25
INSERT INTO users (username, email, password, role)
VALUES ('admindetox', 'admindetox@bloodbank.com', '$2b$10$mwspmX6lQvS.Zp.0R8yw9OT4.b6bAKk9MerBrhUzQyeDujcpWF0nK', 'admin')
ON DUPLICATE KEY UPDATE username = 'admindetox';

-- Create notification table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type ENUM('donation', 'request', 'campaign', 'inventory', 'general') NOT NULL,
    related_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
); 