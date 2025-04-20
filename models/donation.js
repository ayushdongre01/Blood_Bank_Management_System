const pool = require('../utils/database');

class Donation {
    static async findById(donationId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    d.*, 
                    dn.name as donor_name,
                    dn.blood_type as blood_type,
                    s.first_name as staff_first_name,
                    s.last_name as staff_last_name
                FROM donations d
                LEFT JOIN donors dn ON d.donor_id = dn.donor_id
                LEFT JOIN staff s ON d.staff_id = s.staff_id
                WHERE d.donation_id = ?
            `, [donationId]);
            
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding donation by ID:', error);
            throw error;
        }
    }

    static async findByDonorId(donorId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donations
                WHERE donor_id = ?
                ORDER BY donation_date DESC
            `, [donorId]);
            
            return rows;
        } catch (error) {
            console.error('Error finding donations by donor ID:', error);
            throw error;
        }
    }

    static async create(donationData) {
        const connection = await pool.getConnection();
        try {
            const { donor_id, campaign_id = null, donation_date, volume_ml, component, status = 'pending', notes } = donationData;
            
            await connection.beginTransaction();
            
            const [result] = await connection.query(`
                INSERT INTO donations 
                (donor_id, campaign_id, donation_date, volume_ml, component, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [donor_id, campaign_id, donation_date, volume_ml, component, status, notes]);
            
            // If completed, update donor's last donation date and stats
            if (status === 'completed') {
                // Get current donor stats
                const [donorStats] = await connection.query(`
                    SELECT total_donations, total_volume_ml FROM donors 
                    WHERE donor_id = ?
                `, [donor_id]);
                
                if (donorStats && donorStats.length > 0) {
                    const currentDonations = donorStats[0].total_donations || 0;
                    const currentVolume = donorStats[0].total_volume_ml || 0;
                    const newVolume = currentVolume + (volume_ml || 0);
                    
                    await connection.query(`
                        UPDATE donors
                        SET last_donation_date = ?,
                            total_donations = ?, 
                            total_volume_ml = ?
                        WHERE donor_id = ?
                    `, [donation_date, currentDonations + 1, newVolume, donor_id]);
                } else {
                    // First donation for this donor
                    await connection.query(`
                        UPDATE donors
                        SET last_donation_date = ?,
                            total_donations = 1, 
                            total_volume_ml = ?
                        WHERE donor_id = ?
                    `, [donation_date, volume_ml || 0, donor_id]);
                }
            }
            
            await connection.commit();
            return { donation_id: result.insertId, ...donationData };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating donation:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, donationData) {
        try {
            const { donation_date, volume_ml, component, notes } = donationData;
            
            await pool.query(`
                UPDATE donations
                SET donation_date = ?, volume_ml = ?, component = ?, notes = ?
                WHERE donation_id = ?
            `, [donation_date, volume_ml, component, notes, id]);
            
            return { donation_id: id, ...donationData };
        } catch (error) {
            console.error('Error updating donation:', error);
            throw error;
        }
    }

    static async updateStatus(id, status, notes = null) {
        try {
            let query = `
                UPDATE donations
                SET status = ?
            `;
            
            const params = [status];
            
            if (notes) {
                query += `, notes = CONCAT(IFNULL(notes, ''), '\n', ?)`;
                params.push(notes);
            }
            
            query += ` WHERE donation_id = ?`;
            params.push(id);
            
            await pool.query(query, params);
            
            // If completed, update donor's last donation date
            if (status === 'completed') {
                const [donation] = await pool.query('SELECT donor_id, donation_date, volume_ml FROM donations WHERE donation_id = ?', [id]);
                
                if (donation && donation.length > 0) {
                    // Update the donor's last donation date
                    await pool.query(`
                        UPDATE donors
                        SET last_donation_date = ?
                        WHERE donor_id = ?
                    `, [donation[0].donation_date, donation[0].donor_id]);
                    
                    // Also update donor's donation statistics (get current stats and increment)
                    const [donorStats] = await pool.query(`
                        SELECT total_donations, total_volume_ml FROM donors 
                        WHERE donor_id = ?
                    `, [donation[0].donor_id]);
                    
                    if (donorStats && donorStats.length > 0) {
                        const currentDonations = donorStats[0].total_donations || 0;
                        const currentVolume = donorStats[0].total_volume_ml || 0;
                        const newVolume = currentVolume + (donation[0].volume_ml || 0);
                        
                        await pool.query(`
                            UPDATE donors
                            SET total_donations = ?, 
                                total_volume_ml = ?
                            WHERE donor_id = ?
                        `, [currentDonations + 1, newVolume, donation[0].donor_id]);
                    } else {
                        // First donation for this donor
                        await pool.query(`
                            UPDATE donors
                            SET total_donations = 1, 
                                total_volume_ml = ?
                            WHERE donor_id = ?
                        `, [donation[0].volume_ml || 0, donation[0].donor_id]);
                    }
                }
            }
            
            return { donation_id: id, status, updated: true };
        } catch (error) {
            console.error('Error updating donation status:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            await pool.query('DELETE FROM donations WHERE donation_id = ?', [id]);
            return { donation_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting donation:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT d.*, dn.name as donor_name, dn.blood_type
                FROM donations d
                JOIN donors dn ON d.donor_id = dn.donor_id
                ORDER BY d.donation_date DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting all donations:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT d.*, dn.name as donor_name, dn.blood_type
                FROM donations d
                JOIN donors dn ON d.donor_id = dn.donor_id
                WHERE d.donation_id = ?
            `, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding donation by id:', error);
            throw error;
        }
    }

    static async findByDonorId(donorId) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM donations
                WHERE donor_id = ?
                ORDER BY donation_date DESC
            `, [donorId]);
            return rows;
        } catch (error) {
            console.error('Error finding donations by donor id:', error);
            throw error;
        }
    }

    static async findRecentDonations(limit = 5) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    d.*, 
                    dn.name as donor_name,
                    dn.blood_type as blood_type
                FROM donations d
                LEFT JOIN donors dn ON d.donor_id = dn.donor_id
                ORDER BY d.donation_date DESC
                LIMIT ?
            `, [limit]);
            
            return rows;
        } catch (error) {
            console.error('Error finding recent donations:', error);
            throw error;
        }
    }

    static async getPendingRequestsByDonor(donorId) {
        try {
            const [rows] = await pool.query(`
                SELECT *
                FROM donations
                WHERE donor_id = ? AND status = 'pending'
                ORDER BY donation_id ASC
            `, [donorId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting pending requests by donor:', error);
            throw error;
        }
    }

    static async getRequestsByDonor(donorId) {
        try {
            const [rows] = await pool.query(`
                SELECT *
                FROM donations
                WHERE donor_id = ?
                ORDER BY donation_id ASC
            `, [donorId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting requests by donor:', error);
            throw error;
        }
    }

    static async getRequestById(requestId) {
        try {
            const [rows] = await pool.query(`
                SELECT *
                FROM donations
                WHERE donation_id = ?
            `, [requestId]);
            
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error getting request by ID:', error);
            throw error;
        }
    }

    static async createRequest(donorId, requestData) {
        try {
            const { donation_date, appointment_date, campaign_id, notes } = requestData;
            
            const [result] = await pool.query(`
                INSERT INTO donations
                (donor_id, donation_date, appointment_date, volume_ml, campaign_id, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                donorId,
                donation_date || new Date().toISOString().split('T')[0],
                appointment_date || null,
                450, // Default donation volume
                campaign_id || null,
                notes || null,
                'pending' // Default status
            ]);
            
            return { donation_id: result.insertId, ...requestData };
        } catch (error) {
            console.error('Error creating donation request:', error);
            throw error;
        }
    }

    static async cancelRequest(requestId) {
        try {
            const [result] = await pool.query(`
                UPDATE donations
                SET status = 'rejected'
                WHERE donation_id = ? AND status = 'pending'
            `, [requestId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error canceling donation request:', error);
            throw error;
        }
    }

    static async deleteRequest(id) {
        try {
            await pool.query('DELETE FROM donations WHERE donation_id = ?', [id]);
            return { donation_id: id, deleted: true };
        } catch (error) {
            console.error('Error deleting donation request:', error);
            throw error;
        }
    }

    static async getPendingCount() {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM donations
                WHERE status = 'pending'
            `);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting pending donations count:', error);
            throw error;
        }
    }

    static async getAllRequests() {
        try {
            const [rows] = await pool.query(`
                SELECT d.*, dn.name as donor_name, dn.blood_type
                FROM donations d
                JOIN donors dn ON d.donor_id = dn.donor_id
                ORDER BY d.created_at ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting all donation requests:', error);
            throw error;
        }
    }

    static async findByStatus(status) {
        try {
            const [rows] = await pool.query(`
                SELECT d.*, dn.name as donor_name, dn.blood_type
                FROM donations d
                JOIN donors dn ON d.donor_id = dn.donor_id
                WHERE d.status = ?
                ORDER BY d.created_at ASC
            `, [status]);
            return rows;
        } catch (error) {
            console.error('Error finding donations by status:', error);
            throw error;
        }
    }

    static async addScreening(donationId, screeningData) {
        try {
            const { hemoglobin, pressure, pulse, temperature, weight, eligibility, notes } = screeningData;
            
            const [result] = await pool.query(`
                INSERT INTO donation_screenings
                (donation_id, hemoglobin, pressure, pulse, temperature, weight, eligibility, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [donationId, hemoglobin, pressure, pulse, temperature, weight, eligibility, notes]);
            
            // Update donation status based on eligibility
            const status = eligibility === 'eligible' ? 'approved' : 'rejected';
            await this.updateStatus(donationId, status, `Screening result: ${eligibility}`);
            
            return { screening_id: result.insertId, ...screeningData };
        } catch (error) {
            console.error('Error adding screening:', error);
            throw error;
        }
    }

    static async updateScreening(screeningId, screeningData) {
        try {
            const { hemoglobin, pressure, pulse, temperature, weight, eligibility, notes } = screeningData;
            
            await pool.query(`
                UPDATE donation_screenings
                SET hemoglobin = ?, pressure = ?, pulse = ?, temperature = ?, weight = ?, eligibility = ?, notes = ?
                WHERE screening_id = ?
            `, [hemoglobin, pressure, pulse, temperature, weight, eligibility, notes, screeningId]);
            
            // Get donation ID
            const [screening] = await pool.query('SELECT donation_id FROM donation_screenings WHERE screening_id = ?', [screeningId]);
            
            if (screening.length) {
                // Update donation status based on eligibility
                const status = eligibility === 'eligible' ? 'approved' : 'rejected';
                await this.updateStatus(screening[0].donation_id, status, `Screening updated: ${eligibility}`);
            }
            
            return { screening_id: screeningId, ...screeningData };
        } catch (error) {
            console.error('Error updating screening:', error);
            throw error;
        }
    }

    static async approveRequest(id, appointmentDate, notes) {
        try {
            await pool.query(`
                UPDATE donations
                SET status = 'approved', 
                    appointment_date = ?, 
                    notes = CONCAT(IFNULL(notes, ''), '\n', ?)
                WHERE donation_id = ?
            `, [appointmentDate, notes, id]);
            
            return { donation_id: id, status: 'approved', updated: true };
        } catch (error) {
            console.error('Error approving donation request:', error);
            throw error;
        }
    }

    static async rejectRequest(id, reason) {
        try {
            await pool.query(`
                UPDATE donations
                SET status = 'rejected', 
                    notes = CONCAT(IFNULL(notes, ''), '\nRejection reason: ', ?)
                WHERE donation_id = ?
            `, [reason, id]);
            
            return { donation_id: id, status: 'rejected', updated: true };
        } catch (error) {
            console.error('Error rejecting donation request:', error);
            throw error;
        }
    }
}

module.exports = Donation; 