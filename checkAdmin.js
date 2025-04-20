const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmin() {
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
        
        // Check if admin user exists
        const [users] = await connection.query(`
            SELECT user_id, username, email, role, is_active, password 
            FROM users 
            WHERE username = 'admin'
        `);
        
        if (users.length) {
            console.log('Admin user found:');
            console.log(users[0]);
        } else {
            console.log('Admin user not found. Creating admin user...');
            
            // Create admin user if doesn't exist
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await connection.query(`
                INSERT INTO users (username, email, password, role)
                VALUES ('admin', 'admin@bloodbank.com', ?, 'admin')
            `, [hashedPassword]);
            
            console.log('Admin user created with password: admin123');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

checkAdmin(); 