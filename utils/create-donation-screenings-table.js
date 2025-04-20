// Script to create donation_screenings table
const pool = require('./database');

async function createDonationScreeningsTable() {
    try {
        console.log('Connecting to database...');
        
        // Check if donation_screenings table exists
        console.log('Checking if donation_screenings table exists...');
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donation_screenings'
        `);
        
        if (tables.length === 0) {
            // Create the donation_screenings table
            console.log('Creating donation_screenings table...');
            await pool.query(`
                CREATE TABLE donation_screenings (
                    screening_id INT AUTO_INCREMENT PRIMARY KEY,
                    donation_id INT NOT NULL,
                    hemoglobin FLOAT,
                    pressure VARCHAR(20),
                    pulse INT,
                    temperature FLOAT,
                    weight FLOAT,
                    eligibility ENUM('eligible', 'ineligible') DEFAULT 'eligible',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (donation_id) REFERENCES donations(donation_id) ON DELETE CASCADE
                )
            `);
            console.log('Donation screenings table created successfully!');
        } else {
            console.log('Donation screenings table already exists.');
        }
        
        console.log('Donation screenings table setup completed!');
        
        // Close the database connection after a short delay
        setTimeout(() => {
            console.log('Closing connection...');
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error setting up donation screenings table:', error);
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

console.log('Starting donation screenings table setup script...');
createDonationScreeningsTable(); 