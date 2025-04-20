const pool = require('../utils/database');

class Donor {
    static async findAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donors
                ORDER BY name ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error finding all donors:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donors
                WHERE donor_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding donor by id:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donors
                WHERE donor_id = ?
            `, [userId]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding donor by user id:', error);
            throw error;
        }
    }

    static async findByBloodType(bloodType) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donors
                WHERE blood_type = ?
                ORDER BY name ASC
            `, [bloodType]);
            return rows;
        } catch (error) {
            console.error('Error finding donors by blood type:', error);
            throw error;
        }
    }

    static async create(donorData) {
        try {
            const { user_id, name, date_of_birth, gender, blood_type, contact_number, email, address, profile_image } = donorData;
            
            const [result] = await pool.query(`
                INSERT INTO donors 
                (user_id, name, date_of_birth, gender, blood_type, contact_number, email, address, profile_image, total_donations, total_volume_ml)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [user_id, name, date_of_birth, gender, blood_type, contact_number, email, address, profile_image, 0, 0]);
            
            return { donor_id: result.insertId, ...donorData };
        } catch (error) {
            console.error('Error creating donor:', error);
            throw error;
        }
    }

    static async createWithConnection(connection, donorData) {
        try {
            const { donor_id, name, gender, date_of_birth, blood_type, contact_no, email, address, profile_image } = donorData;
            
            // Use the provided donor_id (which should match user_id)
            await connection.query(`
                INSERT INTO donors 
                (donor_id, name, gender, date_of_birth, blood_type, contact_no, email, address, profile_image, total_donations, total_volume_ml)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [donor_id, name, gender, date_of_birth, blood_type, contact_no, email, address, profile_image || null, 0, 0]);
            
            return { donor_id, ...donorData };
        } catch (error) {
            console.error('Error creating donor with connection:', error);
            throw error;
        }
    }

    static async update(id, donorData) {
        try {
            const { 
                name, date_of_birth, gender, blood_type, 
                contact_number, email, address, profile_image,
                last_donation_date, total_donations, total_volume_ml  
            } = donorData;
            
            let query = `
                UPDATE donors
                SET name = ?, date_of_birth = ?, gender = ?, blood_type = ?, 
                    contact_number = ?, email = ?, address = ?
            `;
            
            const params = [name, date_of_birth, gender, blood_type, contact_number, email, address];
            
            if (profile_image) {
                query += ', profile_image = ?';
                params.push(profile_image);
            }
            
            if (last_donation_date !== undefined) {
                query += ', last_donation_date = ?';
                params.push(last_donation_date);
            }
            
            if (total_donations !== undefined) {
                query += ', total_donations = ?';
                params.push(total_donations);
            }
            
            if (total_volume_ml !== undefined) {
                query += ', total_volume_ml = ?';
                params.push(total_volume_ml);
            }
            
            query += ' WHERE donor_id = ?';
            params.push(id);
            
            await pool.query(query, params);
            
            return { donor_id: id, ...donorData };
        } catch (error) {
            console.error('Error updating donor:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await pool.query('DELETE FROM donors WHERE donor_id = ?', [id]);
            return { donor_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting donor:', error);
            throw error;
        }
    }

    static async getDonationHistory(donorId) {
        try {
            const [rows] = await pool.query(`
                SELECT *, updated_at as completion_date FROM donations
                WHERE donor_id = ?
                ORDER BY 
                    status = 'completed' DESC,  -- Completed donations first
                    CASE WHEN appointment_date IS NULL THEN 0 ELSE 1 END DESC,
                    appointment_date DESC, 
                    donation_date DESC
            `, [donorId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting donation history:', error);
            throw error;
        }
    }

    static async getTotalDonations(donorId) {
        try {
            // Get total donation count and volume
            const [donationsResult] = await pool.query(`
                SELECT 
                    COUNT(*) as count,
                    SUM(volume_ml) as total_volume_ml
                FROM donations
                WHERE donor_id = ? AND status = 'completed'
            `, [donorId]);
            
            // Get last donation details - most recent based on donation_date
            const [lastDonationResult] = await pool.query(`
                SELECT * FROM donations
                WHERE donor_id = ? AND status = 'completed'
                ORDER BY donation_date DESC
                LIMIT 1
            `, [donorId]);
            
            // Get the latest (most recent) appointment date from completed donations
            const [latestAppointmentResult] = await pool.query(`
                SELECT appointment_date FROM donations
                WHERE donor_id = ? AND status = 'completed' AND appointment_date IS NOT NULL
                ORDER BY appointment_date DESC
                LIMIT 1
            `, [donorId]);
            
            // Prepare the lastDonation object with latestAppointmentDate
            let lastDonation = null;
            if (lastDonationResult.length > 0) {
                lastDonation = lastDonationResult[0];
                // Add the latest appointment date if available
                if (latestAppointmentResult.length > 0 && latestAppointmentResult[0].appointment_date) {
                    lastDonation.latest_appointment_date = latestAppointmentResult[0].appointment_date;
                }
            }
            
            // Combine the results
            return {
                count: donationsResult[0].count || 0,
                total_volume_ml: donationsResult[0].total_volume_ml || 0,
                lastDonation: lastDonation
            };
        } catch (error) {
            console.error('Error getting total donations:', error);
            throw error;
        }
    }

    static async getTotalCount() {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM donors
            `);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting total donor count:', error);
            throw error;
        }
    }

    static async search(query) {
        try {
            const searchQuery = `%${query}%`;
            const [rows] = await pool.query(`
                SELECT * FROM donors
                WHERE name LIKE ? OR 
                      email LIKE ? OR 
                      address LIKE ? OR
                      contact_number LIKE ?
                ORDER BY name ASC
            `, [searchQuery, searchQuery, searchQuery, searchQuery]);
            return rows;
        } catch (error) {
            console.error('Error searching donors:', error);
            throw error;
        }
    }

    static async cancelDonationRequest(donationId, donorId) {
        try {
            // Verify the donation belongs to this donor and is in a cancellable state
            const [donationResult] = await pool.query(`
                SELECT * FROM donations
                WHERE donation_id = ? AND donor_id = ? AND status IN ('pending', 'approved')
            `, [donationId, donorId]);
            
            if (donationResult.length === 0) {
                throw new Error('Donation request not found or cannot be cancelled');
            }
            
            // Update the status to cancelled
            await pool.query(`
                UPDATE donations
                SET status = 'cancelled', 
                    updated_at = NOW(),
                    notes = CONCAT(IFNULL(notes, ''), '\nCancelled by donor at ', NOW())
                WHERE donation_id = ?
            `, [donationId]);
            
            return { donation_id: donationId, status: 'cancelled', updated: true };
        } catch (error) {
            console.error('Error cancelling donation request:', error);
            throw error;
        }
    }
}

module.exports = Donor; 