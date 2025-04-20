// Script to create donations table
const pool = require('./database');

async function createDonationsTable() {
    try {
        console.log('Connecting to database...');
        
        // Check if donations table exists
        console.log('Checking if donations table exists...');
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donations'
        `);
        
        if (tables.length === 0) {
            // Create the donations table
            console.log('Creating donations table...');
            await pool.query(`
                CREATE TABLE donations (
                    donation_id INT AUTO_INCREMENT PRIMARY KEY,
                    donor_id INT NOT NULL,
                    donation_date DATE NOT NULL,
                    appointment_date DATE,
                    volume_ml INT DEFAULT 450,
                    campaign_id INT,
                    staff_id INT,
                    component VARCHAR(100),
                    status ENUM('pending', 'approved', 'completed', 'rejected') DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE
                )
            `);
            console.log('Donations table created successfully!');
        } else {
            console.log('Donations table already exists.');
        }
        
        console.log('Donations table setup completed!');
        
        // Close the database connection after a short delay
        setTimeout(() => {
            console.log('Closing connection...');
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error setting up donations table:', error);
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

console.log('Starting donations table setup script...');
createDonationsTable(); 