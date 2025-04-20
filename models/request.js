const pool = require('../utils/database');

class Request {
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT br.*, r.name as recipient_name, r.blood_type, h.name as hospital_name
                FROM blood_requests br
                JOIN recipients r ON br.recipient_id = r.recipient_id
                JOIN hospitals h ON br.hospital_id = h.hospital_id
                ORDER BY br.request_date DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all blood requests:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT br.*, r.name as recipient_name, r.blood_type, h.name as hospital_name
                FROM blood_requests br
                JOIN recipients r ON br.recipient_id = r.recipient_id
                JOIN hospitals h ON br.hospital_id = h.hospital_id
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
                SELECT br.*, r.name as recipient_name, r.blood_type
                FROM blood_requests br
                JOIN recipients r ON br.recipient_id = r.recipient_id
                WHERE br.hospital_id = ?
                ORDER BY br.request_date DESC
            `, [hospitalId]);
            return rows;
        } catch (error) {
            console.error('Error finding blood requests by hospital id:', error);
            throw error;
        }
    }

    static async findByStatus(status) {
        try {
            const [rows] = await pool.query(`
                SELECT br.*, r.name as recipient_name, r.blood_type, h.name as hospital_name
                FROM blood_requests br
                JOIN recipients r ON br.recipient_id = r.recipient_id
                JOIN hospitals h ON br.hospital_id = h.hospital_id
                WHERE br.status = ?
                ORDER BY br.request_date DESC
            `, [status]);
            return rows;
        } catch (error) {
            console.error('Error finding blood requests by status:', error);
            throw error;
        }
    }

    static async create(requestData) {
        try {
            const { recipient_id, hospital_id, blood_type, component, quantity_ml, request_date, required_date, status = 'Pending', notes } = requestData;
            
            const [result] = await pool.query(`
                INSERT INTO blood_requests 
                (recipient_id, hospital_id, blood_type, component, quantity_ml, request_date, required_date, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [recipient_id, hospital_id, blood_type, component, quantity_ml, request_date, required_date, status, notes]);
            
            return { request_id: result.insertId, ...requestData };
        } catch (error) {
            console.error('Error creating blood request:', error);
            throw error;
        }
    }

    static async update(id, requestData) {
        try {
            const { recipient_id, blood_type, component, quantity_ml, required_date, notes } = requestData;
            
            await pool.query(`
                UPDATE blood_requests
                SET recipient_id = ?, blood_type = ?, component = ?, quantity_ml = ?, required_date = ?, notes = ?
                WHERE request_id = ?
            `, [recipient_id, blood_type, component, quantity_ml, required_date, notes, id]);
            
            return { request_id: id, ...requestData, updated: true };
        } catch (error) {
            console.error('Error updating blood request:', error);
            throw error;
        }
    }

    static async updateStatus(id, status) {
        try {
            await pool.query(`
                UPDATE blood_requests
                SET status = ?
                WHERE request_id = ?
            `, [status, id]);
            
            return { request_id: id, status, updated: true };
        } catch (error) {
            console.error('Error updating blood request status:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await pool.query('DELETE FROM blood_requests WHERE request_id = ?', [id]);
            return { request_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting blood request:', error);
            throw error;
        }
    }
}

module.exports = Request; 