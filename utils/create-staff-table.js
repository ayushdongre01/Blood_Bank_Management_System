// Create staff table script
const pool = require('./database');

// Function to create/update the staff table
async function createStaffTable() {
    try {
        console.log('Starting staff table creation/update...');
        
        // First create the table if it doesn't exist with minimal columns
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS staff (
                staff_id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE
            )
        `;
        
        console.log('Creating table if not exists...');
        await pool.query(createTableQuery);
        
        // Check if columns exist and add them if they don't
        console.log('Adding columns if they do not exist...');
        
        // Get existing columns
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff'
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
        console.log('Existing columns:', existingColumns);
        
        // Add columns if they don't exist
        if (!existingColumns.includes('phone')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN phone VARCHAR(20)`);
                console.log('Added phone column');
            } catch (e) {
                console.log('Error adding phone column:', e.message);
            }
        }
        
        if (!existingColumns.includes('position')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN position VARCHAR(100)`);
                console.log('Added position column');
            } catch (e) {
                console.log('Error adding position column:', e.message);
            }
        }
        
        if (!existingColumns.includes('department')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN department VARCHAR(100)`);
                console.log('Added department column');
            } catch (e) {
                console.log('Error adding department column:', e.message);
            }
        }
        
        if (!existingColumns.includes('profile_image')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN profile_image VARCHAR(255)`);
                console.log('Added profile_image column');
            } catch (e) {
                console.log('Error adding profile_image column:', e.message);
            }
        }
        
        if (!existingColumns.includes('created_at')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
                console.log('Added created_at column');
            } catch (e) {
                console.log('Error adding created_at column:', e.message);
            }
        }
        
        if (!existingColumns.includes('updated_at')) {
            try {
                await pool.query(`ALTER TABLE staff ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
                console.log('Added updated_at column');
            } catch (e) {
                console.log('Error adding updated_at column:', e.message);
            }
        }
        
        console.log('Staff table updated!');
        console.log('Complete! Now you can manage staff members.');
        
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error updating staff table:', error);
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

// Execute the function
console.log('Script started');
createStaffTable(); 