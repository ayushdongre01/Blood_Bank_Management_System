const mysql = require('mysql2/promise');
require('dotenv').config();

// Get password and remove quotes if they exist
let password = process.env.DB_PASSWORD;
if (password && password.startsWith('"') && password.endsWith('"')) {
    password = password.slice(1, -1);
}

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: password,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    }
})();

module.exports = pool; 