const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    let connection;

    try {
        // Create connection without database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('Connected to MySQL server');
        
        // Drop the database if it exists
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log(`Dropped database ${process.env.DB_NAME} if it existed`);

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'createDatabase.sql');
        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

        // Split SQL commands by semicolon
        const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim() !== '');

        // Execute each SQL command
        for (const command of sqlCommands) {
            await connection.query(command);
            console.log('Executed SQL command successfully');
        }

        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the initialization
initializeDatabase(); 