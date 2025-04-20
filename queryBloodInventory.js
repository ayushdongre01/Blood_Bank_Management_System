const pool = require('./utils/database');

(async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM blood_inventory');
        console.log('Blood inventory data:');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Error fetching blood inventory:', error);
        process.exit(1);
    }
})(); 