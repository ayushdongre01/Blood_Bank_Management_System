const pool = require('./utils/database');

async function checkBloodInventory() {
    try {
        console.log("Checking blood_inventory table structure...");
        const [rows] = await pool.query('DESCRIBE blood_inventory');
        console.table(rows);
        
        console.log("\nChecking blood_inventory data...");
        const [data] = await pool.query('SELECT * FROM blood_inventory');
        console.table(data);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBloodInventory(); 