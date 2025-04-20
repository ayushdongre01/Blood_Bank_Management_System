const pool = require('./utils/database');

async function updateBloodInventory() {
    try {
        // Define the blood types and their inventory data
        const bloodInventoryData = [
            { blood_type: 'A+', quantity_available: 15, current_status: 'Available' },
            { blood_type: 'A-', quantity_available: 8, current_status: 'Moderate' },
            { blood_type: 'B+', quantity_available: 12, current_status: 'Available' },
            { blood_type: 'B-', quantity_available: 5, current_status: 'Moderate' },
            { blood_type: 'AB+', quantity_available: 6, current_status: 'Moderate' },
            { blood_type: 'AB-', quantity_available: 3, current_status: 'Low' },
            { blood_type: 'O+', quantity_available: 20, current_status: 'Available' },
            { blood_type: 'O-', quantity_available: 2, current_status: 'Critical' }
        ];
        
        console.log("Checking if blood_inventory table exists...");
        
        // Try to create the table if it doesn't exist
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS blood_inventory (
                    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
                    blood_type VARCHAR(5) NOT NULL,
                    quantity_available INT NOT NULL DEFAULT 0,
                    current_status VARCHAR(20) NOT NULL DEFAULT 'Available',
                    expiry_date DATE,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log("Blood inventory table created or already exists.");
        } catch (error) {
            console.error("Error creating blood_inventory table:", error);
        }
        
        // For each blood type, insert or update the inventory
        for (const item of bloodInventoryData) {
            try {
                // Check if the blood type already exists
                const [existing] = await pool.query(
                    'SELECT * FROM blood_inventory WHERE blood_type = ?',
                    [item.blood_type]
                );
                
                if (existing.length > 0) {
                    // Update existing record
                    console.log(`Updating ${item.blood_type} inventory...`);
                    await pool.query(
                        'UPDATE blood_inventory SET quantity_available = ?, current_status = ? WHERE blood_type = ?',
                        [item.quantity_available, item.current_status, item.blood_type]
                    );
                } else {
                    // Insert new record
                    console.log(`Adding ${item.blood_type} inventory...`);
                    await pool.query(
                        'INSERT INTO blood_inventory (blood_type, quantity_available, current_status) VALUES (?, ?, ?)',
                        [item.blood_type, item.quantity_available, item.current_status]
                    );
                }
            } catch (error) {
                console.error(`Error updating ${item.blood_type} inventory:`, error);
            }
        }
        
        console.log("\nBlood inventory update completed!");
        
        // Fetch and display updated data
        const [data] = await pool.query('SELECT * FROM blood_inventory');
        console.table(data);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateBloodInventory(); 