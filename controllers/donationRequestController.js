const Donation = require('../models/donation');
const Donor = require('../models/donor');
const catchAsync = require('../utils/catchAsync');

// Get all donation requests
module.exports.getAllRequests = catchAsync(async (req, res) => {
    // Get filter from query params
    const { status } = req.query;
    
    let requests;
    if (status) {
        requests = await Donation.findByStatus(status);
    } else {
        requests = await Donation.getAllRequests();
    }
    
    // Fetch donor details for each request if not already included
    if (requests.length > 0 && !requests[0].donor_name) {
        for (const request of requests) {
            const donor = await Donor.findById(request.donor_id);
            if (donor) {
                request.donor_name = donor.name;
                request.blood_type = donor.blood_type;
            }
        }
    }
    
    // Sort requests by creation date (ascending order - oldest first)
    requests.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    res.render('donation-requests/index', { 
        requests,
        currentStatus: status || 'all',
        title: 'Donation Requests',
        currentUser: req.user
    });
});

// Get donation request details
module.exports.getRequestDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const request = await Donation.getRequestById(id);
    
    if (!request) {
        req.flash('error', 'Donation request not found');
        return res.redirect('/donationrequests');
    }
    
    // Fetch donor details if not already included
    let donor = null;
    if (!request.donor_name) {
        donor = await Donor.findById(request.donor_id);
    }
    
    res.render('donation-requests/detail', { 
        request,
        donor,
        title: 'Donation Request Details',
        currentUser: req.user
    });
});

// Approve donation request
module.exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { appointmentDate, notes } = req.body;
    
    if (!appointmentDate) {
        req.flash('error', 'Appointment date is required');
        return res.redirect(`/donationrequests/${id}`);
    }
    
    await Donation.approveRequest(id, appointmentDate, notes || 'Request approved');
    
    req.flash('success', 'Donation request approved successfully');
    res.redirect('/donationrequests');
});

// Reject donation request
module.exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
        req.flash('error', 'Rejection reason is required');
        return res.redirect(`/donationrequests/${id}`);
    }
    
    await Donation.rejectRequest(id, reason);
    
    req.flash('success', 'Donation request rejected successfully');
    res.redirect('/donationrequests');
});

// Schedule donation request
module.exports.scheduleRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { appointmentDate, notes } = req.body;
    
    if (!appointmentDate) {
        req.flash('error', 'Appointment date is required');
        return res.redirect(`/donationrequests/${id}`);
    }
    
    await Donation.approveRequest(id, appointmentDate, notes || 'Appointment scheduled');
    
    req.flash('success', 'Donation appointment scheduled successfully');
    res.redirect('/donationrequests');
});

// Complete donation request
module.exports.completeRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { volume_donated, blood_type, notes } = req.body;
    
    // 1. Get the donation request
    const request = await Donation.getRequestById(id);
    
    if (!request) {
        req.flash('error', 'Donation request not found');
        return res.redirect('/donationrequests');
    }
    
    if (request.status !== 'approved') {
        req.flash('error', 'Only approved requests can be completed');
        return res.redirect(`/donationrequests/${id}`);
    }
    
    // 2. Update the donation with volume information first
    const today = new Date().toISOString().split('T')[0];
    await Donation.update(id, {
        ...request,
        volume_ml: parseInt(volume_donated),
        donation_date: today // Update to today
    });
    
    // 3. Update donation status to completed (this will also update donor stats)
    await Donation.updateStatus(id, 'completed', notes || 'Donation completed successfully');
    
    // 4. Update blood inventory
    try {
        const BloodInventory = require('../models/bloodInventory');
        // Convert ml to units (1 unit = ~450ml)
        const units = parseFloat(volume_donated) / 450;
        
        await BloodInventory.updateQuantity(blood_type, units);
    } catch (error) {
        console.error('Error updating blood inventory:', error);
        req.flash('warning', 'Donation completed but inventory update failed');
        return res.redirect('/donationrequests');
    }
    
    req.flash('success', 'Donation completed successfully and inventory updated');
    res.redirect('/donationrequests');
}); 