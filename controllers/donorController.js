const User = require('../models/user');
const Donor = require('../models/donor');

const catchAsync = require('../utils/catchAsync');
const { formatDate } = require('../utils/helpers');

// Admin/Staff: Get all donors
module.exports.getAllDonors = catchAsync(async (req, res) => {
    const donors = await Donor.findAll();
    res.render('donors/index', { 
        donors, 
        title: 'All Donors',
        currentUser: req.user
    });
});

// Admin/Staff: Search donors
module.exports.searchDonors = catchAsync(async (req, res) => {
    const { query, bloodType } = req.query;
    let donors = [];
    
    if (bloodType) {
        donors = await Donor.findByBloodType(bloodType);
    } else if (query) {
        donors = await Donor.search(query);
    } else {
        donors = await Donor.findAll();
    }
    
    res.render('donors/index', { 
        donors, 
        query, 
        bloodType,
        title: 'Search Donors',
        currentUser: req.user
    });
});

// Admin/Staff: Get donor by ID
module.exports.getDonorById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const donor = await Donor.findById(id);
    
    if (!donor) {
        req.flash('error', 'Donor not found');
        return res.redirect('/donors');
    }
    
    const donationHistory = await Donor.getDonationHistory(id);
    const donationStats = await Donor.getTotalDonations(id);
    
    res.render('donors/show', { donor, donationHistory, donationStats });
});

module.exports.renderDonorDashboard = catchAsync(async (req, res) => {
    if (!req.user?.user_id) {
        req.flash('error', 'Please login first');
        return res.redirect('/login');
    }

    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('info', 'Please complete your donor profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    // Fetch actual donation history and stats
    const donationHistory = await Donor.getDonationHistory(donor.donor_id).catch(err => {
        console.error('Error fetching donation history:', err);
        return [];
    });
    
    const donationStats = await Donor.getTotalDonations(donor.donor_id).catch(err => {
        console.error('Error fetching donation stats:', err);
        return { count: 0, lastDonation: null, total_volume_ml: 0 };
    });
    
    // Fetch other dashboard data (can be implemented later)
    const upcomingCampaigns = [];
    const pendingRequests = [];

    res.render('donors/dashboard', { 
        donor: donor || {}, 
        donationHistory: donationHistory || [],
        donationStats: donationStats || { count: 0, lastDonation: null },
        upcomingCampaigns: upcomingCampaigns || [],
        pendingRequests: pendingRequests || [],
        title: 'Donor Dashboard'
    });
});

// Donor: Get donation history
module.exports.getDonationHistory = catchAsync(async (req, res) => {
    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    // Fetch actual donation history and stats
    const donationHistory = await Donor.getDonationHistory(donor.donor_id).catch(err => {
        console.error('Error fetching donation history:', err);
        return [];
    });
    
    const donationStats = await Donor.getTotalDonations(donor.donor_id).catch(err => {
        console.error('Error fetching donation stats:', err);
        return { count: 0, lastDonation: null };
    });
    
    res.render('donors/donations', { 
        donationHistory, 
        donationStats,
        donor,
        title: 'Donation History' 
    });
});

// Donor: Render edit profile form
module.exports.renderEditProfile = catchAsync(async (req, res) => {
    const userId = req.user ? req.user.user_id : req.session.userId;
    let donor = null;
    let userData = null;
    
    if (userId) {
        // Check for existing donor profile
        donor = await Donor.findByUserId(userId);
        
        // If no donor profile exists, get user data to pre-populate the form
        if (!donor) {
            userData = await User.findById(userId);
        }
    }
    
    res.render('donors/edit-profile', { 
        donor, 
        userData,
        title: donor ? 'Update Donor Profile' : 'Complete Donor Profile' 
    });
});

// Donor: Update donor profile
module.exports.updateDonorProfile = catchAsync(async (req, res) => {
    const userId = req.user ? req.user.user_id : req.session.userId;
    const donorData = req.body.donor;
    
    // Handle profile image upload if present
    if (req.file) {
        donorData.profile_image = req.file.path;
    }
    
    let donor = await Donor.findByUserId(userId);
    
    if (donor) {
        // Update existing donor
        await Donor.update(donor.donor_id, {
            ...donorData,
            user_id: userId
        });
    } else {
        // Create new donor profile
        await Donor.create({
            ...donorData,
            user_id: userId
        });
    }
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/donors/profile/dashboard');
});

// Donor: Render donation request form
module.exports.renderDonationRequestForm = catchAsync(async (req, res) => {
    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    // Comment out reference to non-existent Campaign model
    /*
    const campaigns = await Campaign.getOngoing().catch(err => {
        console.error('Error fetching campaigns:', err);
        return [];
    });
    */
    
    // Temporary solution
    const campaigns = [];
    
    // Check if eligible to donate (last donation > 3 months ago)
    let isEligible = true;
    let nextEligibleDate = null;
    
    if (donor.last_donation_date) {
        const lastDonation = new Date(donor.last_donation_date);
        const threeMonthsLater = new Date(lastDonation);
        threeMonthsLater.setMonth(lastDonation.getMonth() + 3);
        
        isEligible = threeMonthsLater <= new Date();
        if (!isEligible) {
            nextEligibleDate = formatDate(threeMonthsLater);
        }
    }
    
    res.render('donors/donation-request', { 
        donor, 
        campaigns, 
        isEligible, 
        nextEligibleDate,
        title: 'Donation Request Form'
    });
});

// Donor: Create donation request
module.exports.createDonationRequest = catchAsync(async (req, res) => {
    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    const { donationDate, appointmentDate, campaignId, healthUpdate } = req.body;
    
    // Create donation request using the Donation model
    const Donation = require('../models/donation');
    
    await Donation.createRequest(donor.donor_id, {
        donation_date: donationDate,
        appointment_date: appointmentDate,
        campaign_id: campaignId || null,
        notes: healthUpdate || null
    });
    
    req.flash('success', 'Donation request submitted successfully');
    res.redirect('/donors/donation/requests');
});

// Donor: Get donation requests
module.exports.getDonationRequests = catchAsync(async (req, res) => {
    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    // Get donation requests using the Donation model
    const Donation = require('../models/donation');
    
    const requests = await Donation.getRequestsByDonor(donor.donor_id).catch(err => {
        console.error('Error fetching donation requests:', err);
        return [];
    });
    
    res.render('donors/donation-requests', { 
        requests,
        donor,
        title: 'My Donation Requests'
    });
});

// Donor: Get donation request details
module.exports.getDonationRequestDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    // Use the donor object from req.donor set by the middleware
    const donor = req.donor || await Donor.findByUserId(req.user.user_id);
    
    if (!donor) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/donors/edit-profile');
    }
    
    // Get donation request details using the Donation model
    const Donation = require('../models/donation');
    
    const request = await Donation.getRequestById(id);
    
    if (!request || request.donor_id !== donor.donor_id) {
        req.flash('error', 'Donation request not found');
        return res.redirect('/donors/donation/requests');
    }
    
    res.render('donors/donation-request-details', { 
        request,
        donor,
        title: 'Donation Request Details'
    });
});

// Donor: Cancel donation request
module.exports.cancelDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Get the donor ID from the logged-in user
    const donorId = await getDonorIdFromUser(req.user.user_id);
    
    if (!donorId) {
        req.flash('error', 'Donor profile not found');
        return res.redirect('/donors/profile');
    }
    
    try {
        // Cancel the donation request
        await Donor.cancelDonationRequest(id, donorId);
        
        req.flash('success', 'Donation request cancelled successfully');
        
        // Redirect back to the original page if provided, or to the dashboard
        const redirectUrl = req.query.redirect || '/donors/dashboard';
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error cancelling donation request:', error);
        req.flash('error', error.message || 'Error cancelling donation request');
        return res.redirect('/donors/dashboard');
    }
});

// Donor: Render donor profile
module.exports.renderDonorProfile = catchAsync(async (req, res) => {
    let donor;
    
    // If a donor_id is provided in the URL, use that instead of the logged-in user
    if (req.params.donor_id) {
        donor = await Donor.findById(req.params.donor_id);
    } else if (req.user) {
        // If user is logged in, get their donor profile
        donor = req.donor || await Donor.findByUserId(req.user.user_id);
    } else {
        // No donor_id in URL and not logged in
        req.flash('error', 'Donor profile not found');
        return res.redirect('/');
    }
    
    if (!donor) {
        req.flash('error', 'Donor profile not found');
        return res.redirect('/');
    }
    
    // Fetch actual donation history and stats
    const donationHistory = await Donor.getDonationHistory(donor.donor_id).catch(err => {
        console.error('Error fetching donation history:', err);
        return [];
    });
    
    const donationStats = await Donor.getTotalDonations(donor.donor_id).catch(err => {
        console.error('Error fetching donation stats:', err);
        return { count: 0, total_volume_ml: 0, lastDonation: null };
    });
    
    res.render('donors/profile', { 
        donor,
        donationHistory,
        donationStats,
        title: 'Donor Profile',
        currentUser: req.user
    });
});

// Donor: Get donation certificate
module.exports.getDonationCertificate = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Get the donor ID from the logged-in user
    const donorId = await getDonorIdFromUser(req.user.user_id);
    
    if (!donorId) {
        req.flash('error', 'Donor profile not found');
        return res.redirect('/donors/profile');
    }
    
    try {
        // Get donation details using Donation model
        const Donation = require('../models/donation');
        const donation = await Donation.getRequestById(id);
        
        if (!donation || donation.donor_id !== donorId) {
            req.flash('error', 'Donation not found');
            return res.redirect('/donors/donation/requests');
        }
        
        if (donation.status !== 'completed') {
            req.flash('error', 'Certificate is only available for completed donations');
            return res.redirect(`/donors/donation/request/${id}`);
        }
        
        // Get donor details
        const donor = await Donor.findById(donorId);
        
        res.render('donors/certificate', {
            donation,
            donor,
            title: 'Donation Certificate',
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        req.flash('error', 'Error generating certificate');
        return res.redirect(`/donors/donation/request/${id}`);
    }
});

// Donor: Get printable donation certificate
module.exports.getPrintableDonationCertificate = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Get the donor ID from the logged-in user
    const donorId = await getDonorIdFromUser(req.user.user_id);
    
    if (!donorId) {
        req.flash('error', 'Donor profile not found');
        return res.redirect('/donors/profile');
    }
    
    try {
        // Get donation details using Donation model
        const Donation = require('../models/donation');
        const donation = await Donation.getRequestById(id);
        
        if (!donation || donation.donor_id !== donorId) {
            req.flash('error', 'Donation not found');
            return res.redirect('/donors/donation/requests');
        }
        
        if (donation.status !== 'completed') {
            req.flash('error', 'Certificate is only available for completed donations');
            return res.redirect(`/donors/donation/request/${id}`);
        }
        
        // Get donor details
        const donor = await Donor.findById(donorId);
        
        res.render('donors/certificate-print', {
            donation,
            donor,
            title: 'Printable Donation Certificate',
            currentUser: req.user,
            layout: 'layouts/print' // Use a print-friendly layout if available
        });
    } catch (error) {
        console.error('Error generating printable certificate:', error);
        req.flash('error', 'Error generating printable certificate');
        return res.redirect(`/donors/donation/request/${id}`);
    }
});

// Helper function to get donor ID from user ID
async function getDonorIdFromUser(userId) {
    const donor = await Donor.findByUserId(userId);
    return donor ? donor.donor_id : null;
} 