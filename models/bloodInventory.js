const pool = require('../utils/database');

class BloodInventory {
    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM blood_inventory
                ORDER BY blood_type ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting all blood inventory:', error);
            throw error;
        }
    }

    static async getByType(bloodType) {
        try {
            const [rows] = await pool.query(`
                SELECT * FROM blood_inventory
                WHERE blood_type = ?
            `, [bloodType]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error getting blood inventory by type:', error);
            throw error;
        }
    }

    static async update(inventoryId, data) {
        try {
            const { quantity_available, current_status } = data;
            
            try {
                await pool.query(`
                    UPDATE blood_inventory
                    SET quantity_available = ?,
                        current_status = COALESCE(?, current_status)
                    WHERE inventory_id = ?
                `, [quantity_available, current_status, inventoryId]);
            } catch (err) {
                // If there's an error with current_status column, try a simpler query
                if (err.message.includes('current_status')) {
                    console.warn('current_status column does not exist, updating only quantity');
                    await pool.query(`
                        UPDATE blood_inventory
                        SET quantity_available = ?
                        WHERE inventory_id = ?
                    `, [quantity_available, inventoryId]);
                } else {
                    throw err; // Re-throw if it's a different error
                }
            }
            
            return { inventory_id: inventoryId, ...data };
        } catch (error) {
            console.error('Error updating blood inventory:', error);
            throw error;
        }
    }

    static async updateQuantity(bloodType, quantity) {
        try {
            // First check if the blood type exists
            const inventory = await this.getByType(bloodType);
            
            if (inventory) {
                // Update existing record
                await pool.query(`
                    UPDATE blood_inventory
                    SET quantity_available = quantity_available + ?
                    WHERE blood_type = ?
                `, [quantity, bloodType]);
                
                return { 
                    blood_type: bloodType, 
                    quantity_added: quantity, 
                    new_total: inventory.quantity_available + quantity 
                };
            } else {
                // Insert new record - first check if current_status column exists
                try {
                    await pool.query(`
                        INSERT INTO blood_inventory (blood_type, quantity_available, current_status)
                        VALUES (?, ?, 'available')
                    `, [bloodType, quantity]);
                } catch (err) {
                    // If there's an error with current_status column, try without it
                    if (err.message.includes('current_status')) {
                        await pool.query(`
                            INSERT INTO blood_inventory (blood_type, quantity_available)
                            VALUES (?, ?)
                        `, [bloodType, quantity]);
                    } else {
                        throw err; // Re-throw if it's a different error
                    }
                }
                
                return { 
                    blood_type: bloodType, 
                    quantity_added: quantity, 
                    new_total: quantity 
                };
            }
        } catch (error) {
            console.error('Error updating blood quantity:', error);
            throw error;
        }
    }

    static async getBloodTypeTotals() {
        try {
            const [rows] = await pool.query(`
                SELECT blood_type, SUM(quantity_available) as total
                FROM blood_inventory
                WHERE current_status = 'available'
                GROUP BY blood_type
                ORDER BY blood_type
            `);
            return rows;
        } catch (error) {
            console.error('Error getting blood type totals:', error);
            throw error;
        }
    }

    static async getAllBloodTypes() {
        return [
            'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
        ];
    }

    static async updateFullDetails(id, { blood_type, quantity_available, components, expiry_date, current_status }) {
        try {
            // Check if an ID was provided
            if (id) {
                // Update existing record by ID
                try {
                    await pool.query(`
                        UPDATE blood_inventory
                        SET blood_type = ?,
                            quantity_available = ?,
                            components = ?,
                            expiry_date = ?,
                            current_status = ?
                        WHERE id = ?
                    `, [blood_type, quantity_available, components, expiry_date, current_status, id]);
                } catch (err) {
                    // If there's an error with current_status column, try without it
                    if (err.message.includes('current_status')) {
                        await pool.query(`
                            UPDATE blood_inventory
                            SET blood_type = ?,
                                quantity_available = ?,
                                components = ?,
                                expiry_date = ?
                            WHERE id = ?
                        `, [blood_type, quantity_available, components, expiry_date, id]);
                    } else {
                        throw err; // Re-throw if it's a different error
                    }
                }
            } else {
                // Update by blood type
                try {
                    await pool.query(`
                        UPDATE blood_inventory
                        SET quantity_available = ?,
                            components = ?,
                            expiry_date = ?,
                            current_status = ?
                        WHERE blood_type = ?
                    `, [quantity_available, components, expiry_date, current_status, blood_type]);
                } catch (err) {
                    // If there's an error with current_status column, try without it
                    if (err.message.includes('current_status')) {
                        await pool.query(`
                            UPDATE blood_inventory
                            SET quantity_available = ?,
                                components = ?,
                                expiry_date = ?
                            WHERE blood_type = ?
                        `, [quantity_available, components, expiry_date, blood_type]);
                    } else {
                        throw err; // Re-throw if it's a different error
                    }
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating blood inventory details:', error);
            throw error;
        }
    }

    static async findByStatus(status) {
        try {
            try {
                const [rows] = await pool.query(`
                    SELECT * FROM blood_inventory WHERE current_status = ?
                `, [status]);
                return rows;
            } catch (err) {
                // If there's an error with current_status column, return all inventory instead
                if (err.message.includes('current_status')) {
                    console.warn('current_status column does not exist, returning all inventory items');
                    const [rows] = await pool.query('SELECT * FROM blood_inventory');
                    return rows;
                } else {
                    throw err;
                }
            }
        } catch (error) {
            console.error('Error finding blood inventory by status:', error);
            throw error;
        }
    }

    static async findExpiring(days) {
        try {
            // Calculate the date that is 'days' from now
            const currentDate = new Date();
            const futureDate = new Date();
            futureDate.setDate(currentDate.getDate() + parseInt(days));
            
            // Format dates for MySQL query
            const formattedCurrentDate = currentDate.toISOString().split('T')[0];
            const formattedFutureDate = futureDate.toISOString().split('T')[0];
            
            try {
                const [rows] = await pool.query(`
                    SELECT * FROM blood_inventory 
                    WHERE expiration_date BETWEEN ? AND ?
                    AND current_status = 'available'
                    ORDER BY expiration_date ASC
                `, [formattedCurrentDate, formattedFutureDate]);
                return rows;
            } catch (err) {
                // If there's an error with column names, try with expiry_date instead
                if (err.message.includes('expiration_date')) {
                    const [rows] = await pool.query(`
                        SELECT * FROM blood_inventory 
                        WHERE expiry_date BETWEEN ? AND ?
                        AND current_status = 'available'
                        ORDER BY expiry_date ASC
                    `, [formattedCurrentDate, formattedFutureDate]);
                    return rows;
                } else if (err.message.includes('current_status')) {
                    // Try without the current_status filter if that column doesn't exist
                    try {
                        const [rows] = await pool.query(`
                            SELECT * FROM blood_inventory 
                            WHERE expiration_date BETWEEN ? AND ?
                            ORDER BY expiration_date ASC
                        `, [formattedCurrentDate, formattedFutureDate]);
                        return rows;
                    } catch (innerErr) {
                        if (innerErr.message.includes('expiration_date')) {
                            const [rows] = await pool.query(`
                                SELECT * FROM blood_inventory 
                                WHERE expiry_date BETWEEN ? AND ?
                                ORDER BY expiry_date ASC
                            `, [formattedCurrentDate, formattedFutureDate]);
                            return rows;
                        } else {
                            throw innerErr;
                        }
                    }
                } else {
                    throw err;
                }
            }
        } catch (error) {
            console.error('Error finding expiring blood inventory:', error);
            throw error;
        }
    }

    static async calculateAndUpdateFromDonations() {
        try {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                
                // Step 1: Get all completed donations with blood types
                const [donationsWithBloodType] = await connection.query(`
                    SELECT d.donation_id, d.donor_id, d.volume_ml, dr.blood_type
                    FROM donations d
                    JOIN donors dr ON d.donor_id = dr.donor_id
                    WHERE d.status = 'completed' AND d.volume_ml > 0
                `);
                
                // Step 2: Calculate total volume per blood type
                const bloodTypeTotals = {};
                donationsWithBloodType.forEach(donation => {
                    if (!donation.blood_type) return; // Skip if blood type is not available
                    
                    if (!bloodTypeTotals[donation.blood_type]) {
                        bloodTypeTotals[donation.blood_type] = 0;
                    }
                    bloodTypeTotals[donation.blood_type] += donation.volume_ml || 0;
                });
                
                // Step 3: Convert volume to units and update inventory
                const results = [];
                for (const [bloodType, totalVolume] of Object.entries(bloodTypeTotals)) {
                    const units = totalVolume / 450; // Convert ml to units
                    
                    // Check if blood type exists in inventory
                    const [existingRecord] = await connection.query(`
                        SELECT * FROM blood_inventory WHERE blood_type = ?
                    `, [bloodType]);
                    
                    if (existingRecord.length > 0) {
                        // Update existing record
                        await connection.query(`
                            UPDATE blood_inventory
                            SET quantity_available = ?
                            WHERE blood_type = ?
                        `, [units, bloodType]);
                    } else {
                        // Insert new record
                        await connection.query(`
                            INSERT INTO blood_inventory (blood_type, quantity_available)
                            VALUES (?, ?)
                        `, [bloodType, units]);
                    }
                    
                    results.push({ 
                        blood_type: bloodType, 
                        total_volume_ml: totalVolume,
                        units: units.toFixed(2)
                    });
                }
                
                await connection.commit();
                return results;
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error calculating blood inventory from donations:', error);
            throw error;
        }
    }
}

module.exports = BloodInventory; 