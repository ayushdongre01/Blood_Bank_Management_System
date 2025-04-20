const pool = require('../utils/database');

class Recipient {
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM recipient
                ORDER BY name ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all recipients:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM recipient
                WHERE recipient_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding recipient by id:', error);
            throw error;
        }
    }

    static async findByBloodType(bloodType) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM recipient
                WHERE blood_type = ?
                ORDER BY name ASC
            `, [bloodType]);
            return rows;
        } catch (error) {
            console.error('Error finding recipients by blood type:', error);
            throw error;
        }
    }

    static async create(recipientData) {
        try {
            const { 
                name, 
                date_of_birth, 
                gender, 
                blood_type, 
                contact_no, 
                email, 
                address, 
                receiver_type, 
                medical_history 
            } = recipientData;
            
            // Build columns and values dynamically
            const columns = ['name', 'date_of_birth', 'gender', 'blood_type', 'contact_no', 'address', 'hospital_id'];
            const values = [name, date_of_birth, gender, blood_type, contact_no, address, recipientData.hospital_id];
            
            // Add optional fields if they exist
            if (email) {
                columns.push('email');
                values.push(email);
            }
            
            if (receiver_type) {
                columns.push('receiver_type');
                values.push(receiver_type);
            }
            
            if (medical_history) {
                columns.push('medical_history');
                values.push(medical_history);
            }
            
            const placeholders = values.map(() => '?').join(', ');
            
            const [result] = await pool.query(`
                INSERT INTO recipient 
                (${columns.join(', ')})
                VALUES (${placeholders})
            `, values);
            
            return { recipient_id: result.insertId, ...recipientData };
        } catch (error) {
            console.error('Error creating recipient:', error);
            throw error;
        }
    }

    static async update(id, recipientData) {
        try {
            const { 
                name, 
                date_of_birth, 
                gender, 
                blood_type, 
                contact_no, 
                email, 
                address, 
                receiver_type, 
                medical_history 
            } = recipientData;
            
            // Build query dynamically
            let updateFields = [];
            let updateValues = [];
            
            if (name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            
            if (date_of_birth !== undefined) {
                updateFields.push('date_of_birth = ?');
                updateValues.push(date_of_birth);
            }
            
            if (gender !== undefined) {
                updateFields.push('gender = ?');
                updateValues.push(gender);
            }
            
            if (blood_type !== undefined) {
                updateFields.push('blood_type = ?');
                updateValues.push(blood_type);
            }
            
            if (contact_no !== undefined) {
                updateFields.push('contact_no = ?');
                updateValues.push(contact_no);
            }
            
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }
            
            if (address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(address);
            }
            
            if (receiver_type !== undefined) {
                updateFields.push('receiver_type = ?');
                updateValues.push(receiver_type);
            }
            
            if (medical_history !== undefined) {
                updateFields.push('medical_history = ?');
                updateValues.push(medical_history);
            }
            
            if (updateFields.length === 0) {
                return { recipient_id: id, updated: false };
            }
            
            // Add the ID at the end
            updateValues.push(id);
            
            await pool.query(`
                UPDATE recipient
                SET ${updateFields.join(', ')}
                WHERE recipient_id = ?
            `, updateValues);
            
            return { recipient_id: id, ...recipientData, updated: true };
        } catch (error) {
            console.error('Error updating recipient:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await pool.query('DELETE FROM recipient WHERE recipient_id = ?', [id]);
            return { recipient_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting recipient:', error);
            throw error;
        }
    }

    static async getTransfusionHistory(recipientId) {
        try {
            const [rows] = await pool.query(`
                SELECT t.*, bi.blood_type, bi.component, bi.quantity_ml
                FROM transfusions t
                JOIN blood_inventory bi ON t.inventory_id = bi.inventory_id
                JOIN blood_requests br ON t.request_id = br.request_id
                WHERE br.recipient_id = ?
                ORDER BY t.transfusion_date DESC
            `, [recipientId]);
            return rows;
        } catch (error) {
            console.error('Error getting transfusion history:', error);
            throw error;
        }
    }

    static async findByHospital(hospitalId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM recipient
                WHERE hospital_id = ?
                ORDER BY name ASC
            `, [hospitalId]);
            return rows;
        } catch (error) {
            console.error('Error finding recipients by hospital ID:', error);
            throw error;
        }
    }

    static async search(searchTerm, hospitalId) {
        try {
            const searchPattern = `%${searchTerm}%`;
            let query = `
                SELECT * FROM recipient
                WHERE (name LIKE ? OR blood_type LIKE ? OR contact_number LIKE ?)
            `;
            
            let params = [searchPattern, searchPattern, searchPattern];
            
            // If hospital ID is provided, limit the search to that hospital
            if (hospitalId) {
                query += ` AND hospital_id = ?`;
                params.push(hospitalId);
            }
            
            query += ` ORDER BY name ASC`;
            
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error searching recipients:', error);
            throw error;
        }
    }

    static async findRecentByHospital(hospitalId, limit = 5) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM recipient
                WHERE hospital_id = ?
                ORDER BY recipient_id DESC
                LIMIT ?
            `, [hospitalId, limit]);
            return rows;
        } catch (error) {
            console.error('Error finding recent recipients by hospital:', error);
            throw error;
        }
    }
}

module.exports = Recipient; 