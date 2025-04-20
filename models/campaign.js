const pool = require('../utils/database');

class Campaign {
    static async findById(campaignId) {
        try {
            const [rows] = await pool.query(`
                SELECT c.*, s.first_name, s.last_name 
                FROM campaigns c
                LEFT JOIN staff s ON c.created_by = s.staff_id
                WHERE c.campaign_id = ?
            `, [campaignId]);
            
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding campaign by ID:', error);
            throw error;
        }
    }

    static async create(campaignData) {
        try {
            const { 
                name, 
                description, 
                start_date, 
                end_date, 
                location, 
                organizer, 
                target_amount_ml, 
                status,
                created_by 
            } = campaignData;

            const [result] = await pool.query(`
                INSERT INTO campaigns 
                (name, description, start_date, end_date, location, organizer, target_amount_ml, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, 
                description || null, 
                start_date, 
                end_date, 
                location, 
                organizer, 
                target_amount_ml || null, 
                status || 'upcoming',
                created_by || null
            ]);
            
            return { campaign_id: result.insertId, ...campaignData };
        } catch (error) {
            console.error('Error creating campaign:', error);
            throw error;
        }
    }

    static async update(campaignId, campaignData) {
        try {
            const fields = Object.keys(campaignData)
                .filter(key => campaignData[key] !== undefined)
                .map(key => `${key} = ?`);
            
            if (fields.length === 0) return false;
            
            const values = Object.keys(campaignData)
                .filter(key => campaignData[key] !== undefined)
                .map(key => campaignData[key]);
            
            values.push(campaignId);
            
            const [result] = await pool.query(`
                UPDATE campaigns
                SET ${fields.join(', ')}
                WHERE campaign_id = ?
            `, values);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating campaign:', error);
            throw error;
        }
    }

    static async delete(campaignId) {
        try {
            const [result] = await pool.query(`
                DELETE FROM campaigns
                WHERE campaign_id = ?
            `, [campaignId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting campaign:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM campaigns
                ORDER BY start_date DESC
            `);
            
            return rows;
        } catch (error) {
            console.error('Error getting all campaigns:', error);
            throw error;
        }
    }

    static async getUpcomingCampaigns() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM campaigns
                WHERE status = 'upcoming' OR status = 'ongoing'
                AND start_date >= CURDATE()
                ORDER BY start_date ASC
            `);
            
            return rows;
        } catch (error) {
            console.error('Error getting upcoming campaigns:', error);
            throw error;
        }
    }

    static async updateCollectedAmount(campaignId, additionalAmount) {
        try {
            const [result] = await pool.query(`
                UPDATE campaigns
                SET collected_amount_ml = collected_amount_ml + ?
                WHERE campaign_id = ?
            `, [additionalAmount, campaignId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating collected amount:', error);
            throw error;
        }
    }

    static async getUpcoming() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM campaigns
                WHERE start_date > CURDATE()
                ORDER BY start_date ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting upcoming campaigns:', error);
            throw error;
        }
    }

    static async getOngoing() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM campaigns
                WHERE (status = 'ongoing' AND end_date >= CURDATE())
                OR (start_date <= CURDATE() 
                   AND end_date >= CURDATE()
                   AND status != 'cancelled'
                   AND status != 'completed')
                ORDER BY start_date ASC
            `);
            
            return rows;
        } catch (error) {
            console.error('Error getting ongoing campaigns:', error);
            throw error;
        }
    }

    static async getActiveCount() {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM campaigns
                WHERE end_date >= CURDATE() AND start_date <= CURDATE()
            `);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting active campaign count:', error);
            throw error;
        }
    }

    static async updateCampaignStatusesByDate() {
        try {
            // Update statuses based on current date
            const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
            
            // Update campaigns that should be ongoing (started today or earlier, end date today or later)
            await pool.query(`
                UPDATE campaigns
                SET status = 'ongoing'
                WHERE start_date <= ?
                AND end_date >= ?
                AND status = 'upcoming'
            `, [today, today]);
            
            // Don't automatically mark campaigns as completed when end date is past
            // The user will manually add campaigns to the completed list
            
            return true;
        } catch (error) {
            console.error('Error updating campaign statuses:', error);
            throw error;
        }
    }
}

module.exports = Campaign; 