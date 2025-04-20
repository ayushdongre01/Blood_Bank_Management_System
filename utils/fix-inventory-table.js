// Script to fix blood_inventory table
const pool = require('./database');

async function fixBloodInventoryTable() {
    try {
        console.log('Connecting to database...');
        
        // Check if current_status column exists
        console.log('Checking if current_status column exists...');
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blood_inventory'
        `);
        
        const columnNames = columns.map(col => col.COLUMN_NAME.toLowerCase());
        console.log('Existing columns:', columnNames);
        
        if (!columnNames.includes('current_status')) {
            // Add the missing column
            console.log('Adding current_status column...');
            await pool.query(`
                ALTER TABLE blood_inventory 
                ADD COLUMN current_status VARCHAR(50) DEFAULT 'available'
            `);
            console.log('current_status column added successfully!');
        } else {
            console.log('current_status column already exists.');
        }

        // Ensure we have a status for all existing records
        console.log('Updating existing records with default status...');
        await pool.query(`
            UPDATE blood_inventory
            SET current_status = 'available'
            WHERE current_status IS NULL OR current_status = ''
        `);
        console.log('Successfully updated existing records!');
        
        console.log('Blood inventory table fix completed!');
        
        // Close the database connection after a short delay
        setTimeout(() => {
            console.log('Closing connection...');
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error fixing blood inventory table:', error);
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

console.log('Starting blood inventory table fix script...');
fixBloodInventoryTable(); 