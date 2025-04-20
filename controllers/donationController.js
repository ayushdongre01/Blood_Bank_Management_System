const Donation = require('../models/donation');
const Donor = require('../models/donor');
const BloodInventory = require('../models/bloodInventory');
const catchAsync = require('../utils/catchAsync');

// Get all donations
module.exports.getAllDonations = catchAsync(async (req, res) => {
    const donations = await Donation.getAll();
    res.render('donations/index', { donations, title: 'All Donations' });
});

// Get pending donations
module.exports.getPendingDonations = catchAsync(async (req, res) => {
    const donations = await Donation.findByStatus('pending');
    res.render('donations/pending', { donations, title: 'Pending Donations' });
});

// Get completed donations
module.exports.getCompletedDonations = catchAsync(async (req, res) => {
    const donations = await Donation.findByStatus('completed');
    res.render('donations/completed', { donations, title: 'Completed Donations' });
});

// Get rejected donations
module.exports.getRejectedDonations = catchAsync(async (req, res) => {
    const donations = await Donation.findByStatus('rejected');
    res.render('donations/rejected', { donations, title: 'Rejected Donations' });
});

// Get donation by ID
module.exports.getDonationById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    
    if (!donation) {
        req.flash('error', 'Donation not found');
        return res.redirect('/donations');
    }
    
    const donor = await Donor.findById(donation.donor_id);
    res.render('donations/show', { donation, donor, title: 'Donation Details' });
});

// Create donation
module.exports.createDonation = catchAsync(async (req, res) => {
    const donationData = req.body.donation;
    await Donation.create(donationData);
    req.flash('success', 'Donation record created successfully');
    res.redirect('/donations');
});

// Update donation
module.exports.updateDonation = catchAsync(async (req, res) => {
    const { id } = req.params;
    const donationData = req.body.donation;
    await Donation.update(id, donationData);
    req.flash('success', 'Donation updated successfully');
    res.redirect(`/donations/${id}`);
});

// Update donation status
module.exports.updateDonationStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    await Donation.updateStatus(id, status, notes);
    req.flash('success', 'Donation status updated successfully');
    res.redirect(`/donations/${id}`);
});

// Delete donation
module.exports.deleteDonation = catchAsync(async (req, res) => {
    const { id } = req.params;
    await Donation.delete(id);
    req.flash('success', 'Donation deleted successfully');
    res.redirect('/donations');
});

// Add screening
module.exports.addScreening = catchAsync(async (req, res) => {
    const { id } = req.params;
    const screeningData = req.body.screening;
    
    await Donation.addScreening(id, screeningData);
    req.flash('success', 'Screening results added');
    res.redirect(`/donations/${id}`);
});

// Update screening
module.exports.updateScreening = catchAsync(async (req, res) => {
    const { id, screeningId } = req.params;
    const screeningData = req.body.screening;
    
    await Donation.updateScreening(screeningId, screeningData);
    req.flash('success', 'Screening results updated');
    res.redirect(`/donations/${id}`);
});

// Get donor donations
module.exports.getDonorDonations = catchAsync(async (req, res) => {
    const { donorId } = req.params;
    
    // Ensure the donor is requesting their own records
    if (req.user.role === 'donor') {
        const donor = await Donor.findByUserId(req.user.user_id);
        if (!donor || donor.donor_id != donorId) {
            req.flash('error', 'You can only view your own donations');
            return res.redirect('/donors/profile/dashboard');
        }
    }
    
    const donations = await Donation.findByDonorId(donorId);
    const donor = await Donor.findById(donorId);
    
    res.render('donations/donor', { donations, donor, title: 'Donor Donations' });
});

// Get donor donation by ID
module.exports.getDonorDonationById = catchAsync(async (req, res) => {
    const { donorId, id } = req.params;
    
    // Ensure the donor is requesting their own records
    if (req.user.role === 'donor') {
        const donor = await Donor.findByUserId(req.user.user_id);
        if (!donor || donor.donor_id != donorId) {
            req.flash('error', 'You can only view your own donations');
            return res.redirect('/donors/profile/dashboard');
        }
    }
    
    const donation = await Donation.findById(id);
    
    if (!donation || donation.donor_id != donorId) {
        req.flash('error', 'Donation not found');
        return res.redirect(`/donations/donor/${donorId}`);
    }
    
    const donor = await Donor.findById(donorId);
    res.render('donations/donor-show', { donation, donor, title: 'Donation Details' });
});

// Get donation requests
module.exports.getDonationRequests = catchAsync(async (req, res) => {
    const requests = await Donation.getAllRequests();
    res.render('donations/requests', { requests, title: 'Donation Requests' });
});

// Approve donation request
module.exports.approveDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { appointmentDate, notes } = req.body;
    
    await Donation.approveRequest(id, appointmentDate, notes);
    req.flash('success', 'Donation request approved');
    res.redirect('/donations/requests');
});

// Reject donation request
module.exports.rejectDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await Donation.rejectRequest(id, reason);
    req.flash('success', 'Donation request rejected');
    res.redirect('/donations/requests');
});

// Generate donation certificate
module.exports.generateDonationCertificate = catchAsync(async (req, res) => {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    
    if (!donation) {
        req.flash('error', 'Donation not found');
        return res.redirect('/donors/donation/requests');
    }
    
    if (donation.status !== 'completed') {
        req.flash('error', 'Certificate is only available for completed donations');
        return res.redirect('/donors/donation/requests');
    }
    
    const donor = await Donor.findById(donation.donor_id);
    
    if (!donor) {
        req.flash('error', 'Donor information not found');
        return res.redirect('/donors/donation/requests');
    }
    
    // For donor users, check if they are accessing their own certificate
    if (req.user.role === 'donor') {
        const donorUser = await Donor.findByUserId(req.user.user_id);
        if (!donorUser || donorUser.donor_id !== donation.donor_id) {
            req.flash('error', 'You can only view your own donation certificates');
            return res.redirect('/donors/profile/dashboard');
        }
    }
    
    res.render('donors/donation-certificate', { 
        donation, 
        donor, 
        title: 'Blood Donation Certificate'
    });
}); 