const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateTables() {
    // Create a connection to the database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Connected to the database.');
        
        // Check if the priority column already exists in the blood_requests table
        const [priorityColumns] = await connection.query(`
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'blood_requests' AND COLUMN_NAME = 'priority'
        `, [process.env.DB_NAME]);
        
        if (priorityColumns.length === 0) {
            // Add the priority column to the blood_requests table
            console.log('Adding priority column to blood_requests table...');
            await connection.query(`
                ALTER TABLE blood_requests
                ADD COLUMN priority VARCHAR(50) AFTER required_date
            `);
            console.log('✅ Priority column added to blood_requests table.');
        } else {
            console.log('Priority column already exists in blood_requests table.');
        }
        
        // Check if the receiver_type column already exists in the recipient table
        const [receiverTypeColumns] = await connection.query(`
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'recipient' AND COLUMN_NAME = 'receiver_type'
        `, [process.env.DB_NAME]);
        
        if (receiverTypeColumns.length === 0) {
            // Add the receiver_type column to the recipient table
            console.log('Adding receiver_type column to recipient table...');
            await connection.query(`
                ALTER TABLE recipient
                ADD COLUMN receiver_type VARCHAR(50) AFTER email
            `);
            console.log('✅ receiver_type column added to recipient table.');
        } else {
            console.log('receiver_type column already exists in recipient table.');
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error updating tables:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed.');
    }
}

// Run the migration
updateTables().catch(console.error); 