const pool = require('../utils/database');

class Hospital {
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM hospital
                ORDER BY hospital_name ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all hospitals:', error);
            throw error;
        }
    }

    static async getAll() {
        return this.findAll();
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM hospital
                WHERE hospital_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding hospital by id:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM hospital
                WHERE user_id = ?
            `, [userId]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding hospital by user id:', error);
            throw error;
        }
    }

    static async create(hospitalData) {
        try {
            const { user_id, hospital_name, hospital_address, contact_no, email, profile_image } = hospitalData;
            
            const [result] = await pool.query(`
                INSERT INTO hospital 
                (user_id, hospital_name, hospital_address, contact_no, email, profile_image)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [user_id, hospital_name, hospital_address, contact_no, email, profile_image || null]);
            
            return { hospital_id: result.insertId, ...hospitalData };
        } catch (error) {
            console.error('Error creating hospital:', error);
            throw error;
        }
    }

    static async createWithConnection(connection, hospitalData) {
        try {
            const { hospital_id, hospital_name, hospital_address, contact_no, email, profile_image } = hospitalData;
            
            // Use the provided hospital_id (which should match user_id)
            await connection.query(`
                INSERT INTO hospital 
                (hospital_id, hospital_name, hospital_address, contact_no, email, profile_image)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [hospital_id, hospital_name, hospital_address, contact_no, email, profile_image || null]);
            
            return { hospital_id, ...hospitalData };
        } catch (error) {
            console.error('Error creating hospital with connection:', error);
            throw error;
        }
    }

    static async update(id, hospitalData) {
        try {
            const { hospital_name, hospital_address, contact_no, email, profile_image } = hospitalData;
            
            await pool.query(`
                UPDATE hospital
                SET hospital_name = ?, hospital_address = ?, contact_no = ?, email = ?, 
                    profile_image = COALESCE(?, profile_image)
                WHERE hospital_id = ?
            `, [hospital_name, hospital_address, contact_no, email, profile_image, id]);
            
            return { hospital_id: id, ...hospitalData };
        } catch (error) {
            console.error('Error updating hospital:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await pool.query('DELETE FROM hospital WHERE hospital_id = ?', [id]);
            return { hospital_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting hospital:', error);
            throw error;
        }
    }

    static async getRequestHistory(hospitalId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    br.*, 
                    r.name as recipient_name, 
                    r.blood_type as recipient_blood_type
                FROM blood_requests br
                LEFT JOIN recipient r ON br.recipient_id = r.recipient_id
                WHERE br.hospital_id = ?
                ORDER BY br.request_date DESC
            `, [hospitalId]);
            return rows;
        } catch (error) {
            console.error('Error getting request history:', error);
            throw error;
        }
    }

    static async getTotalCount() {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM hospital
            `);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting total hospital count:', error);
            throw error;
        }
    }

    static async search(query) {
        try {
            const searchQuery = `%${query}%`;
            const [rows] = await pool.query(`
                SELECT * FROM hospital
                WHERE hospital_name LIKE ? OR 
                      hospital_address LIKE ? OR 
                      email LIKE ? OR
                      contact_no LIKE ?
                ORDER BY hospital_name ASC
            `, [searchQuery, searchQuery, searchQuery, searchQuery]);
            return rows;
        } catch (error) {
            console.error('Error searching hospitals:', error);
            throw error;
        }
    }
}

module.exports = Hospital; 