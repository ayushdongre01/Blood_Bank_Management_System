const pool = require('../utils/database');

class BloodRequest {
    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    br.*, 
                    COALESCE(r.name, 'Unknown') as recipient_name, 
                    COALESCE(r.blood_type, br.blood_type) as recipient_blood_type,
                    h.hospital_name as hospital_name
                FROM blood_requests br
                LEFT JOIN recipient r ON br.recipient_id = r.recipient_id
                JOIN hospital h ON br.hospital_id = h.hospital_id
                ORDER BY br.request_date DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all blood requests:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    br.*, 
                    r.name as recipient_name, 
                    r.blood_type as recipient_blood_type,
                    r.gender as recipient_gender,
                    r.date_of_birth as recipient_date_of_birth,
                    r.contact_no as recipient_contact_no,
                    r.email as recipient_email,
                    r.address as recipient_address,
                    r.receiver_type as recipient_type,
                    IFNULL(r.medical_history, '') as recipient_medical_history,
                    r.hospital_id as recipient_hospital_id,
                    h.hospital_id,
                    h.hospital_name,
                    h.hospital_address,
                    h.contact_no as hospital_contact,
                    h.email as hospital_email
                FROM blood_requests br
                LEFT JOIN recipient r ON br.recipient_id = r.recipient_id
                JOIN hospital h ON br.hospital_id = h.hospital_id
                WHERE br.request_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding blood request by id:', error);
            throw error;
        }
    }

    static async findByHospitalId(hospitalId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    br.*, 
                    COALESCE(r.name, 'Unknown') as recipient_name, 
                    COALESCE(r.blood_type, br.blood_type) as recipient_blood_type
                FROM blood_requests br
                LEFT JOIN recipient r ON br.recipient_id = r.recipient_id
                WHERE br.hospital_id = ?
                ORDER BY br.request_date DESC
            `, [hospitalId]);
            return rows;
        } catch (error) {
            console.error('Error finding blood requests by hospital id:', error);
            throw error;
        }
    }

    static async findByStatus(status, limit = null) {
        try {
            let query = `
                SELECT 
                    br.*, 
                    COALESCE(r.name, 'Unknown') as recipient_name, 
                    COALESCE(r.blood_type, br.blood_type) as recipient_blood_type,
                    h.hospital_name as hospital_name
                FROM blood_requests br
                LEFT JOIN recipient r ON br.recipient_id = r.recipient_id
                JOIN hospital h ON br.hospital_id = h.hospital_id
                WHERE br.request_status = ?
                ORDER BY br.request_date DESC
            `;
            
            const queryParams = [status];
            
            if (limit) {
                query += ' LIMIT ?';
                queryParams.push(limit);
            }
            
            const [rows] = await pool.query(query, queryParams);
            return rows;
        } catch (error) {
            console.error('Error finding blood requests by status:', error);
            throw error;
        }
    }

    static async getPendingCount() {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM blood_requests
                WHERE request_status = 'pending'
            `);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting pending requests count:', error);
            throw error;
        }
    }

    static async create(requestData) {
        try {
            const { 
                recipient_id, 
                hospital_id, 
                blood_type, 
                amount_required, 
                request_date, 
                request_status = 'pending', 
                notes,
                component,
                required_date,
                priority
            } = requestData;
            
            // Build the SQL query dynamically based on which fields are provided
            const fields = ['recipient_id', 'hospital_id', 'blood_type', 'amount_required', 'request_date', 'request_status'];
            const values = [recipient_id, hospital_id, blood_type, amount_required, request_date, request_status];
            
            // Add optional fields if they exist
            if (notes !== undefined) {
                fields.push('notes');
                values.push(notes);
            }
            
            if (component !== undefined) {
                fields.push('component');
                values.push(component);
            }
            
            if (required_date !== undefined) {
                fields.push('required_date');
                values.push(required_date);
            }
            
            if (priority !== undefined) {
                fields.push('priority');
                values.push(priority);
            }
            
            // Generate placeholders for the SQL query
            const placeholders = values.map(() => '?').join(', ');
            
            console.log('SQL Query fields:', fields);
            console.log('SQL Query values:', values);
            
            const [result] = await pool.query(`
                INSERT INTO blood_requests 
                (${fields.join(', ')})
                VALUES (${placeholders})
            `, values);
            
            return { request_id: result.insertId, ...requestData };
        } catch (error) {
            console.error('Error creating blood request:', error);
            throw error;
        }
    }

    static async update(id, requestData) {
        try {
            const { recipient_id, blood_type, amount_required, notes } = requestData;
            
            // Build query parts and values array based on which fields are provided
            let queryParts = [];
            let queryValues = [];
            
            if (recipient_id !== undefined) {
                queryParts.push('recipient_id = ?');
                queryValues.push(recipient_id);
            }
            
            if (blood_type !== undefined) {
                queryParts.push('blood_type = ?');
                queryValues.push(blood_type);
            }
            
            if (amount_required !== undefined) {
                queryParts.push('amount_required = ?');
                queryValues.push(amount_required);
            }
            
            if (notes !== undefined) {
                queryParts.push('notes = ?');
                queryValues.push(notes);
            }
            
            // If there's nothing to update, return early
            if (queryParts.length === 0) {
                return { request_id: id, ...requestData, updated: false };
            }
            
            // Add the ID to the values array
            queryValues.push(id);
            
            await pool.query(`
                UPDATE blood_requests
                SET ${queryParts.join(', ')}
                WHERE request_id = ?
            `, queryValues);
            
            return { request_id: id, ...requestData, updated: true };
        } catch (error) {
            console.error('Error updating blood request:', error);
            throw error;
        }
    }

    static async approve(id) {
        try {
            await pool.query(`
                UPDATE blood_requests
                SET request_status = 'approved'
                WHERE request_id = ?
            `, [id]);
            
            return { request_id: id, request_status: 'approved', updated: true };
        } catch (error) {
            console.error('Error approving blood request:', error);
            throw error;
        }
    }
    
    static async fulfill(id) {
        try {
            await pool.query(`
                UPDATE blood_requests
                SET request_status = 'fulfilled'
                WHERE request_id = ?
            `, [id]);
            
            return { request_id: id, request_status: 'fulfilled', updated: true };
        } catch (error) {
            console.error('Error fulfilling blood request:', error);
            throw error;
        }
    }
    
    static async reject(id, reason) {
        try {
            await pool.query(`
                UPDATE blood_requests
                SET request_status = 'rejected', notes = CONCAT(IFNULL(notes, ''), '\nRejection reason: ', ?)
                WHERE request_id = ?
            `, [reason, id]);
            
            return { request_id: id, request_status: 'rejected', updated: true };
        } catch (error) {
            console.error('Error rejecting blood request:', error);
            throw error;
        }
    }

    static async delete(id) {
        let connection;
        try {
            // Get a connection from pool to use transaction
            connection = await pool.getConnection();
            
            // Start transaction
            await connection.beginTransaction();
            
            // Log the delete attempt
            console.log(`Attempting to delete blood request with ID: ${id}`);
            
            // First check if the blood request exists
            const [checkResult] = await connection.query(
                'SELECT request_id, request_status FROM blood_requests WHERE request_id = ?', 
                [id]
            );
            
            if (checkResult.length === 0) {
                throw new Error(`Blood request with ID ${id} not found`);
            }
            
            // Only allow deletion of pending requests
            const request = checkResult[0];
            if (request.request_status !== 'pending') {
                throw new Error(`Cannot cancel blood request with status ${request.request_status}. Only pending requests can be cancelled.`);
            }
            
            // Execute delete query
            const [result] = await connection.query(
                'DELETE FROM blood_requests WHERE request_id = ?', 
                [id]
            );
            
            if (result.affectedRows === 0) {
                throw new Error(`No blood request was deleted. Request ID ${id} may not exist.`);
            }
            
            // Commit transaction
            await connection.commit();
            console.log(`Successfully deleted blood request with ID: ${id}`);
            
            return { request_id: id, deleted: true, affectedRows: result.affectedRows };
        } catch (error) {
            // Rollback transaction if something went wrong
            if (connection) {
                try {
                    await connection.rollback();
                    console.log('Transaction rolled back due to an error');
                } catch (rollbackError) {
                    console.error('Error while rolling back transaction:', rollbackError);
                }
            }
            
            console.error(`Error deleting blood request ID ${id}:`, error);
            throw error;
        } finally {
            // Release connection back to the pool
            if (connection) {
                connection.release();
                console.log('Database connection released');
            }
        }
    }

    static async findByHospitalAndStatus(hospitalId, status) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM blood_requests
                WHERE hospital_id = ? AND request_status = ?
                ORDER BY request_date DESC
            `, [hospitalId, status]);
            return rows;
        } catch (error) {
            console.error('Error finding blood requests by hospital and status:', error);
            throw error;
        }
    }

    static async findRecentByHospital(hospitalId, limit = 5) {
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
                LIMIT ?
            `, [hospitalId, limit]);
            return rows;
        } catch (error) {
            console.error('Error finding recent blood requests by hospital:', error);
            throw error;
        }
    }
}

module.exports = BloodRequest; 