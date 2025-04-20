const Campaign = require('../models/campaign');
const pool = require('../utils/database');

// Campaign controllers
const campaignController = {
    // Public methods
    getAllCampaigns: async (req, res) => {
        try {
            // First update campaign statuses based on dates
            await Campaign.updateCampaignStatusesByDate();
            
            // Query for different campaign types
            const [campaigns] = await pool.query(`
                SELECT * FROM campaigns 
                ORDER BY start_date DESC
            `);
            
            // Get counts for different campaign statuses
            const today = new Date();
            
            // Separate campaigns by status
            const upcomingCampaigns = campaigns.filter(campaign => 
                new Date(campaign.start_date) > today && campaign.status !== 'cancelled'
            );
            
            const ongoingCampaigns = campaigns.filter(campaign => 
                (campaign.status === 'ongoing' && new Date(campaign.end_date) >= today) || 
                (new Date(campaign.start_date) <= today && 
                new Date(campaign.end_date) >= today && 
                campaign.status !== 'cancelled' &&
                campaign.status !== 'completed')
            );
            
            // Only show campaigns in completed section if they have been explicitly marked as completed
            const completedCampaigns = campaigns.filter(campaign => 
                campaign.status === 'completed'
            );
            
            const cancelledCampaigns = campaigns.filter(campaign => 
                campaign.status === 'cancelled'
            );
            
            res.render('campaigns/index', {
                title: 'Blood Donation Campaigns',
                campaigns,
                upcomingCampaigns,
                ongoingCampaigns,
                completedCampaigns,
                cancelledCampaigns
            });
        } catch (error) {
            console.error('Error fetching all campaigns:', error);
            req.flash('error', 'Failed to fetch campaigns');
            res.redirect('/');
        }
    },

    getUpcomingCampaigns: async (req, res) => {
        try {
            // Query for upcoming campaigns
            const [campaigns] = await pool.query(`
                SELECT * FROM campaigns 
                WHERE start_date > CURDATE() AND status != 'cancelled'
                ORDER BY start_date ASC
            `);
            
            res.render('campaigns/upcoming', {
                title: 'Upcoming Blood Donation Campaigns',
                campaigns
            });
        } catch (error) {
            console.error('Error fetching upcoming campaigns:', error);
            req.flash('error', 'Failed to fetch upcoming campaigns');
            res.redirect('/campaigns');
        }
    },

    getOngoingCampaigns: async (req, res) => {
        try {
            // First update campaign statuses based on dates
            await Campaign.updateCampaignStatusesByDate();
            
            // Only show campaigns with status 'ongoing' and end date not in the past
            const [campaigns] = await pool.query(`
                SELECT * FROM campaigns 
                WHERE (status = 'ongoing' AND end_date >= CURDATE())
                OR (start_date <= CURDATE() AND end_date >= CURDATE() AND status != 'cancelled')
                ORDER BY end_date ASC
            `);
            
            res.render('campaigns/ongoing', {
                title: 'Ongoing Blood Donation Campaigns',
                campaigns
            });
        } catch (error) {
            console.error('Error fetching ongoing campaigns:', error);
            req.flash('error', 'Failed to fetch ongoing campaigns');
            res.redirect('/campaigns');
        }
    },

    getCompletedCampaigns: async (req, res) => {
        try {
            // Query for completed campaigns - only those explicitly marked as completed
            const [campaigns] = await pool.query(`
                SELECT * FROM campaigns 
                WHERE status = 'completed'
                ORDER BY end_date DESC
            `);
            
            res.render('campaigns/completed', {
                title: 'Completed Blood Donation Campaigns',
                campaigns
            });
        } catch (error) {
            console.error('Error fetching completed campaigns:', error);
            req.flash('error', 'Failed to fetch completed campaigns');
            res.redirect('/campaigns');
        }
    },

    getCampaignById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Query to get campaign details
            const [campaigns] = await pool.query(`
                SELECT * FROM campaigns WHERE campaign_id = ?
            `, [id]);
            
            const campaign = campaigns[0];
            
            if (!campaign) {
                req.flash('error', 'Campaign not found');
                return res.redirect('/campaigns');
            }
            
            // Determine campaign status
            const today = new Date();
            const startDate = new Date(campaign.start_date);
            const endDate = new Date(campaign.end_date);
            
            let status;
            // Respect the database status for completed and cancelled
            if (campaign.status === 'cancelled') {
                status = 'cancelled';
            } else if (campaign.status === 'completed') {
                status = 'completed';
            } else if (today < startDate) {
                status = 'upcoming';
            } else if (today >= startDate && today <= endDate) {
                status = 'active';
            } else {
                // Ended but not marked as completed - still show as 'ended' but don't change status
                status = 'ended';
            }
            
            res.render('campaigns/show', {
                title: campaign.name,
                campaign,
                status
            });
        } catch (error) {
            console.error('Error fetching campaign by id:', error);
            req.flash('error', 'Failed to fetch campaign details');
            res.redirect('/campaigns');
        }
    },

    // Admin and staff methods
    createCampaign: async (req, res) => {
        try {
            const { 
                name, 
                description, 
                start_date, 
                end_date, 
                location, 
                organizer, 
                target_amount_ml,
                status
            } = req.body;
            
            // Validate required fields
            if (!name || !start_date || !end_date || !location || !organizer) {
                return res.status(400).json({ 
                    message: 'Missing required fields. Name, start date, end date, location, and organizer are required.' 
                });
            }
            
            // Get staff ID from user session
            const created_by = req.user.staff_id || null;
            
            const campaignData = {
                name,
                description,
                start_date,
                end_date,
                location,
                organizer,
                target_amount_ml,
                status: status || 'upcoming',
                created_by
            };
            
            const newCampaign = await Campaign.create(campaignData);
            
            res.status(201).json({
                message: 'Campaign created successfully',
                campaign: newCampaign
            });
        } catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ message: 'Failed to create campaign', error: error.message });
        }
    },

    updateCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                start_date,
                end_date,
                location,
                organizer,
                target_amount_ml,
                status
            } = req.body;
            
            // Validate campaign exists
            const campaign = await Campaign.findById(id);
            
            if (!campaign) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            
            const updatedData = {
                name,
                description,
                start_date,
                end_date,
                location,
                organizer,
                target_amount_ml,
                status
            };
            
            // Filter out undefined values
            Object.keys(updatedData).forEach(key => 
                updatedData[key] === undefined && delete updatedData[key]
            );
            
            const success = await Campaign.update(id, updatedData);
            
            if (!success) {
                return res.status(400).json({ message: 'No changes made to campaign' });
            }
            
            res.status(200).json({
                message: 'Campaign updated successfully'
            });
        } catch (error) {
            console.error('Error updating campaign:', error);
            res.status(500).json({ message: 'Failed to update campaign', error: error.message });
        }
    },

    deleteCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Validate campaign exists
            const campaign = await Campaign.findById(id);
            
            if (!campaign) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            
            const success = await Campaign.delete(id);
            
            if (!success) {
                return res.status(400).json({ message: 'Failed to delete campaign' });
            }
            
            res.status(200).json({
                message: 'Campaign deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting campaign:', error);
            res.status(500).json({ message: 'Failed to delete campaign', error: error.message });
        }
    },

    updateCampaignStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({ 
                    message: 'Invalid status. Status must be one of: upcoming, ongoing, completed, cancelled' 
                });
            }
            
            // Validate campaign exists
            const campaign = await Campaign.findById(id);
            
            if (!campaign) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            
            const success = await Campaign.update(id, { status });
            
            if (!success) {
                return res.status(400).json({ message: 'Failed to update campaign status' });
            }
            
            res.status(200).json({
                message: `Campaign status updated to ${status}`
            });
        } catch (error) {
            console.error('Error updating campaign status:', error);
            res.status(500).json({ message: 'Failed to update campaign status', error: error.message });
        }
    },

    getCampaignDonations: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Check if campaign exists
            const campaign = await Campaign.findById(id);
            
            if (!campaign) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            
            // Query to get donations for this campaign
            const [donations] = await pool.query(`
                SELECT d.*, 
                       donor.first_name, donor.last_name, 
                       b.blood_group, b.rh_factor
                FROM donations d
                JOIN donors donor ON d.donor_id = donor.donor_id
                JOIN blood_inventory b ON d.inventory_id = b.inventory_id
                WHERE d.campaign_id = ?
                ORDER BY d.donation_date DESC
            `, [id]);
            
            res.status(200).json(donations);
        } catch (error) {
            console.error('Error fetching campaign donations:', error);
            res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
        }
    },

    addCampaignDonation: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                donor_id, 
                amount_ml,
                blood_group,
                rh_factor
            } = req.body;
            
            // Validate required fields
            if (!donor_id || !amount_ml || !blood_group || !rh_factor) {
                return res.status(400).json({ 
                    message: 'Missing required fields. Donor ID, amount, blood group and Rh factor are required.' 
                });
            }
            
            // Check if campaign exists
            const campaign = await Campaign.findById(id);
            
            if (!campaign) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            
            // Begin transaction
            const connection = await pool.getConnection();
            await connection.beginTransaction();
            
            try {
                // Create blood inventory entry
                const [inventoryResult] = await connection.query(`
                    INSERT INTO blood_inventory (blood_group, rh_factor, amount_ml, status, source)
                    VALUES (?, ?, ?, 'available', 'campaign')
                `, [blood_group, rh_factor, amount_ml]);
                
                const inventory_id = inventoryResult.insertId;
                
                // Create donation record
                const [donationResult] = await connection.query(`
                    INSERT INTO donations (donor_id, inventory_id, campaign_id, donation_date, amount_ml, status)
                    VALUES (?, ?, ?, NOW(), ?, 'completed')
                `, [donor_id, inventory_id, id, amount_ml]);
                
                // Update campaign collected amount
                await Campaign.updateCollectedAmount(id, amount_ml);
                
                // Commit transaction
                await connection.commit();
                
                res.status(201).json({
                    message: 'Donation added successfully',
                    donation_id: donationResult.insertId,
                    inventory_id
                });
            } catch (error) {
                // Rollback on error
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error adding campaign donation:', error);
            res.status(500).json({ message: 'Failed to add donation', error: error.message });
        }
    },

    // Render forms for creating campaigns
    renderUpcomingCampaignForm: async (req, res) => {
        try {
            // If user is a hospital staff, get hospital info
            let hospital = null;
            if (req.user && req.user.role === 'hospital_staff') {
                const [hospitals] = await pool.query(
                    'SELECT * FROM hospitals WHERE user_id = ?',
                    [req.user.user_id]
                );
                hospital = hospitals.length > 0 ? hospitals[0] : null;
            }
            
            res.render('campaigns/add-upcoming', {
                title: 'Add Upcoming Campaign',
                hospital
            });
        } catch (error) {
            console.error('Error rendering upcoming campaign form:', error);
            req.flash('error', 'An error occurred while loading the form');
            res.redirect('/campaigns');
        }
    },

    renderCompletedCampaignForm: async (req, res) => {
        try {
            // If user is a hospital staff, get hospital info
            let hospital = null;
            if (req.user && req.user.role === 'hospital_staff') {
                const [hospitals] = await pool.query(
                    'SELECT * FROM hospitals WHERE user_id = ?',
                    [req.user.user_id]
                );
                hospital = hospitals.length > 0 ? hospitals[0] : null;
            }
            
            res.render('campaigns/add-completed', {
                title: 'Add Completed Campaign',
                hospital
            });
        } catch (error) {
            console.error('Error rendering completed campaign form:', error);
            req.flash('error', 'An error occurred while loading the form');
            res.redirect('/campaigns');
        }
    },

    // Handle campaign creation from forms
    createUpcomingCampaign: async (req, res) => {
        try {
            const { 
                campaign_name, 
                location, 
                start_date, 
                end_date, 
                description,
                contact_information,
                hospital_id,
                organizer
            } = req.body;

            // Validate required fields
            if (!campaign_name || !location || !start_date) {
                req.flash('error', 'Missing required fields');
                return res.redirect('/campaigns/upcoming/new');
            }

            const finalEndDate = end_date || start_date; // Default to start_date if no end_date
            
            // Determine the correct status based on dates
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to beginning of day
            
            const campaignStartDate = new Date(start_date);
            campaignStartDate.setHours(0, 0, 0, 0);
            
            const campaignEndDate = new Date(finalEndDate);
            campaignEndDate.setHours(23, 59, 59, 999); // Set to end of day
            
            let status;
            if (campaignStartDate > today) {
                status = 'upcoming';
            } else if (campaignStartDate <= today && campaignEndDate >= today) {
                status = 'ongoing';
            } else {
                status = 'upcoming'; // Default to upcoming if something is wrong with dates
            }

            const campaignData = {
                name: campaign_name,
                location,
                start_date,
                end_date: finalEndDate,
                description: description || '',
                contact_info: contact_information || '',
                hospital_id: hospital_id || null,
                organizer: organizer || 'Blood Bank System', // Default organizer name
                status: status,
                created_by: req.user.user_id
            };

            // Insert into database
            const [result] = await pool.query(`
                INSERT INTO campaigns (
                    name, location, start_date, end_date, description, 
                    contact_info, hospital_id, organizer, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                campaignData.name, 
                campaignData.location, 
                campaignData.start_date, 
                campaignData.end_date, 
                campaignData.description,
                campaignData.contact_info,
                campaignData.hospital_id,
                campaignData.organizer,
                campaignData.status,
                campaignData.created_by
            ]);

            req.flash('success', `Campaign created successfully with status: ${status}`);
            res.redirect('/campaigns');
        } catch (error) {
            console.error('Error creating upcoming campaign:', error);
            req.flash('error', 'Failed to create campaign');
            res.redirect('/campaigns/upcoming/new');
        }
    },

    createCompletedCampaign: async (req, res) => {
        try {
            const { 
                campaign_name, 
                location, 
                start_date, 
                end_date, 
                organizer,
                amount_collected,
                donors_participated,
                notes,
                hospital_id
            } = req.body;

            // Validate required fields
            if (!campaign_name || !location || !start_date || !end_date || !organizer || !amount_collected) {
                req.flash('error', 'Missing required fields');
                return res.redirect('/campaigns/completed/new');
            }

            const campaignData = {
                name: campaign_name,
                location,
                start_date,
                end_date,
                organizer,
                amount_collected: parseInt(amount_collected, 10),
                donors_participated: donors_participated ? parseInt(donors_participated, 10) : 0,
                notes: notes || '',
                hospital_id: hospital_id || null,
                status: 'completed',
                created_by: req.user.user_id
            };

            // Insert into database
            const [result] = await pool.query(`
                INSERT INTO campaigns (
                    name, location, start_date, end_date, organizer, amount_collected,
                    donors_participated, notes, hospital_id, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                campaignData.name, 
                campaignData.location, 
                campaignData.start_date, 
                campaignData.end_date, 
                campaignData.organizer,
                campaignData.amount_collected,
                campaignData.donors_participated,
                campaignData.notes,
                campaignData.hospital_id,
                campaignData.status,
                campaignData.created_by
            ]);

            req.flash('success', 'Completed campaign added successfully');
            res.redirect('/campaigns');
        } catch (error) {
            console.error('Error creating completed campaign:', error);
            req.flash('error', 'Failed to create campaign');
            res.redirect('/campaigns/completed/new');
        }
    }
};

module.exports = campaignController; 