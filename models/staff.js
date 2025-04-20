const pool = require('../utils/database');

class Staff {
    static async create(staffData) {
        try {
            // Insert staff record
            const [result] = await pool.query(`
                INSERT INTO staff (
                    first_name, last_name, email, phone, 
                    position, department, profile_image
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                staffData.first_name,
                staffData.last_name,
                staffData.email,
                staffData.phone || null,
                staffData.position,
                staffData.department || null,
                staffData.profile_image || null
            ]);
            
            return {
                staff_id: result.insertId,
                ...staffData
            };
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    }
    
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM staff ORDER BY first_name, last_name
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all staff:', error);
            throw error;
        }
    }
    
    static async findById(staffId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM staff WHERE staff_id = ?
            `, [staffId]);
            
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding staff by ID:', error);
            throw error;
        }
    }
    
    static async findByUserId(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM staff WHERE user_id = ?
            `, [userId]);
            
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding staff by user ID:', error);
            throw error;
        }
    }
    
    static async update(staffId, staffData) {
        try {
            const fields = Object.keys(staffData)
                .filter(key => staffData[key] !== undefined && key !== 'staff_id' && key !== 'user_id')
                .map(key => `${key} = ?`);
                
            if (fields.length === 0) return false;
            
            const values = Object.keys(staffData)
                .filter(key => staffData[key] !== undefined && key !== 'staff_id' && key !== 'user_id')
                .map(key => staffData[key]);
                
            values.push(staffId);
            
            const [result] = await pool.query(`
                UPDATE staff
                SET ${fields.join(', ')}
                WHERE staff_id = ?
            `, values);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    }
    
    static async delete(staffId) {
        try {
            // Delete from staff table
            const [result] = await pool.query(`
                DELETE FROM staff WHERE staff_id = ?
            `, [staffId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    }
}

module.exports = Staff; 