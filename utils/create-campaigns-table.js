// Create campaigns table script
const pool = require('./database');

// Function to create the campaigns table
async function createCampaignsTable() {
    try {
        console.log('Starting campaigns table creation...');
        
        // SQL query to create the campaigns table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS campaigns (
                campaign_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                location VARCHAR(255) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                organizer VARCHAR(255) NOT NULL,
                contact_info VARCHAR(255),
                hospital_id INT,
                status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                amount_collected INT DEFAULT 0,
                donors_participated INT DEFAULT 0,
                notes TEXT
                /* Foreign key removed for now */
                /* FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE SET NULL */
            )
        `;
        
        console.log('Executing query...');
        
        // Execute the create table query
        const [result] = await pool.query(createTableQuery);
        
        console.log('Query executed. Result:', JSON.stringify(result));
        console.log('Campaigns table created or already exists!');
        
        // Add a test campaign
        console.log('Adding a test campaign...');
        const insertTestCampaign = `
            INSERT INTO campaigns (name, description, location, start_date, end_date, organizer)
            VALUES (
                'Test Blood Drive', 
                'A test campaign for the blood donation drive', 
                'City Hospital', 
                DATE_ADD(CURDATE(), INTERVAL 7 DAY), 
                DATE_ADD(CURDATE(), INTERVAL 8 DAY), 
                'Blood Bank System'
            )
        `;
        
        await pool.query(insertTestCampaign);
        
        console.log('Test campaign added successfully!');
        console.log('Complete! Now try accessing the /campaigns route.');
        
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error creating campaigns table:', error);
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

// Execute the function
console.log('Script started');
createCampaignsTable(); 