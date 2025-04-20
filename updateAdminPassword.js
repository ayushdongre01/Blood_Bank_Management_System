const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updateAdminPassword() {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to MySQL server');
        
        // Hash the new password
        const password = 'detox@25'; // Same as current password for consistency
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Update admin user password
        await connection.query(`
            UPDATE users
            SET password = ?
            WHERE username = 'admin'
        `, [hashedPassword]);
        
        console.log('Admin password updated successfully');
        console.log('Login credentials:');
        console.log('Username: admin');
        console.log('Password: detox@25');
    } catch (error) {
        console.error('Error updating admin password:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

updateAdminPassword(); 