const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing MySQL connection...');
    
    // Try different common password combinations
    const credentials = [
        { 
            description: 'With bloodbank_db as database', 
            config: {
                host: 'localhost',
                user: 'root',
                password: 'A123@sh#Do',
                database: 'bloodbank_db'
            }
        },
        { 
            description: 'With original password, no database specified', 
            config: {
                host: 'localhost',
                user: 'root',
                password: 'A123@sh#Do'
            }
        },
        { 
            description: 'Without password', 
            config: {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'bloodbank_db'
            }
        },
        { 
            description: 'With default root password (e.g., "root")', 
            config: {
                host: 'localhost',
                user: 'root',
                password: 'root',
                database: 'bloodbank_db'
            }
        }
    ];
    
    // Try each set of credentials
    for (const { description, config } of credentials) {
        console.log(`\nTrying connection: ${description}`);
        console.log(`Config:`, config);
        
        try {
            const connection = await mysql.createConnection(config);
            console.log('✅ CONNECTION SUCCESSFUL!');
            
            // If we connected without specifying a database, try to create the database
            if (!config.database) {
                try {
                    console.log('Attempting to create database bloodbank_db...');
                    await connection.query('CREATE DATABASE IF NOT EXISTS bloodbank_db');
                    console.log('✅ Database created or already exists!');
                    
                    // Switch to the new database
                    await connection.query('USE bloodbank_db');
                    console.log('✅ Using bloodbank_db database');
                } catch (dbError) {
                    console.error('Error creating database:', dbError.message);
                }
            }
            
            // Test if database exists by listing tables
            try {
                const [tables] = await connection.query('SHOW TABLES');
                console.log('Tables found:', tables.length);
                if (tables.length > 0) {
                    console.log('Tables:', tables.map(t => Object.values(t)[0]));
                }
            } catch (dbError) {
                console.error('Error listing tables:', dbError.message);
            }
            
            await connection.end();
            return config; // Return the working config
        } catch (error) {
            console.error(`❌ Connection failed:`, {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState
            });
        }
    }
    
    console.log('\nAll connection attempts failed.');
    return null;
}

// Run the test
testConnection()
    .then(workingConfig => {
        if (workingConfig) {
            console.log('\n✅ WORKING CONFIGURATION FOUND:');
            console.log(workingConfig);
        }
    })
    .catch(err => {
        console.error('Unexpected error:', err);
    }); 