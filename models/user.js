const pool = require('../utils/database');
const bcrypt = require('bcrypt');

class User {
    static async findByUsername(username) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM users
                WHERE username = ?
            `, [username]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM users
                WHERE email = ?
            `, [email]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM users
                WHERE user_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    static async create(userData) {
        try {
            const { username, email, password, role } = userData;
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const [result] = await pool.query(`
                INSERT INTO users 
                (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `, [username, email, hashedPassword, role]);
            
            return { user_id: result.insertId, username, email, role };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    
    static async createWithConnection(connection, userData) {
        try {
            const { username, email, password, role } = userData;
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const [result] = await connection.query(`
                INSERT INTO users 
                (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `, [username, email, hashedPassword, role]);
            
            return { user_id: result.insertId, username, email, role };
        } catch (error) {
            console.error('Error creating user with connection:', error);
            throw error;
        }
    }
    
    static async updateLastLogin(id) {
        try {
            await pool.query(`
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `, [id]);
            return true;
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }
    
    static async changePassword(id, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            await pool.query(`
                UPDATE users
                SET password = ?
                WHERE user_id = ?
            `, [hashedPassword, id]);
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
    
    static async toggleActiveStatus(id) {
        try {
            const [user] = await pool.query(`
                SELECT is_active FROM users
                WHERE user_id = ?
            `, [id]);
            
            if (!user.length) return false;
            
            const newStatus = !user[0].is_active;
            
            await pool.query(`
                UPDATE users
                SET is_active = ?
                WHERE user_id = ?
            `, [newStatus, id]);
            
            return newStatus;
        } catch (error) {
            console.error('Error toggling active status:', error);
            throw error;
        }
    }
    
    // Methods for Passport authentication
    static async authenticate(username, password, done) {
        try {
            const user = await User.findByUsername(username);
            
            if (!user) return done(null, false, { message: 'Incorrect username.' });
            if (!user.is_active) return done(null, false, { message: 'Account is inactive.' });
            
            const isValid = await bcrypt.compare(password, user.password);
            
            if (!isValid) return done(null, false, { message: 'Incorrect password.' });
            
            await User.updateLastLogin(user.user_id);
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
    
    static serializeUser(user, done) {
        done(null, user.user_id);
    }
    
    static async deserializeUser(id, done) {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    }
    
    static async findByRole(role) {
        try {
            const [users] = await pool.query(`
                SELECT * FROM users
                WHERE role = ?
            `, [role]);
            
            return users;
        } catch (error) {
            console.error('Error finding users by role:', error);
            throw error;
        }
    }
}

// Export the User class and also passport-compatible methods
module.exports = User;
User.authenticate = User.authenticate;
User.serializeUser = User.serializeUser;
User.deserializeUser = User.deserializeUser; 