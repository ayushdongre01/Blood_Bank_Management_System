const pool = require('./utils/database');

(async () => {
    try {
        const [rows] = await pool.query('DESCRIBE recipient');
        console.log('Recipient table schema:');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Error fetching schema:', error);
        process.exit(1);
    }
})(); 