const Donor = require('../models/donor');
const Hospital = require('../models/hospital');
const User = require('../models/user');
const Donation = require('../models/donation');
const BloodInventory = require('../models/bloodInventory');
const Campaign = require('../models/campaign');
const BloodRequest = require('../models/bloodRequest');
const catchAsync = require('../utils/catchAsync');

// Dashboard
module.exports.renderDashboard = catchAsync(async (req, res) => {
    // Get counts and stats for dashboard
    const [
        donorCount,
        hospitalCount,
        inventoryStats,
        pendingDonations,
        pendingRequests,
        campaignStats,
        recentDonations,
        recentBloodRequests
    ] = await Promise.all([
        Donor.getTotalCount(),
        Hospital.getTotalCount(),
        BloodInventory.getStats(),
        Donation.getPendingCount(),
        BloodRequest.getPendingCount(),
        Campaign.getActiveCount(),
        Donation.findRecentDonations(5),
        BloodRequest.findByStatus('pending', 5)
    ].map(p => p.catch(err => {
        console.error(`Error in dashboard data fetch: ${err.message}`);
        return null;
    })));

    res.render('admin/dashboard', {
        donorCount: donorCount || 0,
        hospitalCount: hospitalCount || 0,
        inventoryStats: inventoryStats || {},
        pendingDonations: pendingDonations || 0,
        pendingRequests: pendingRequests || 0,
        campaignStats: campaignStats || 0,
        recentDonations: recentDonations || [],
        recentBloodRequests: recentBloodRequests || [],
        title: 'Admin Dashboard'
    });
});

// Inventory management
module.exports.getInventory = catchAsync(async (req, res) => {
    const inventory = await BloodInventory.getAll();
    res.render('admin/inventory', { inventory, title: 'Blood Inventory' });
});

module.exports.renderAddInventoryForm = catchAsync(async (req, res) => {
    res.render('admin/add-inventory', { title: 'Add Inventory' });
});

module.exports.addInventory = catchAsync(async (req, res) => {
    const inventoryData = req.body.inventory;
    await BloodInventory.create(inventoryData);
    req.flash('success', 'Inventory added successfully');
    res.redirect('/admin/inventory');
});

module.exports.updateInventory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const inventoryData = req.body.inventory;
    await BloodInventory.update(id, inventoryData);
    req.flash('success', 'Inventory updated successfully');
    res.redirect('/admin/inventory');
});

module.exports.deleteInventory = catchAsync(async (req, res) => {
    const { id } = req.params;
    await BloodInventory.delete(id);
    req.flash('success', 'Inventory deleted successfully');
    res.redirect('/admin/inventory');
});

// Donation requests management
module.exports.getDonationRequests = catchAsync(async (req, res) => {
    const requests = await Donation.getAllRequests();
    res.render('admin/donation-requests', { requests, title: 'Donation Requests' });
});

module.exports.getDonationRequestDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await Donation.getRequestById(id);
    
    if (!request) {
        req.flash('error', 'Donation request not found');
        return res.redirect('/admin/donation-requests');
    }
    
    const donor = await Donor.findById(request.donor_id);
    res.render('admin/donation-request-details', { request, donor, title: 'Donation Request Details' });
});

module.exports.approveDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await Donation.approveRequest(id);
    req.flash('success', 'Donation request approved');
    res.redirect('/admin/donation-requests');
});

module.exports.rejectDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    await Donation.rejectRequest(id, reason);
    req.flash('success', 'Donation request rejected');
    res.redirect('/admin/donation-requests');
});

module.exports.deleteDonationRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await Donation.deleteRequest(id);
    req.flash('success', 'Donation request deleted');
    res.redirect('/admin/donation-requests');
});

// Blood requests management
module.exports.getBloodRequests = catchAsync(async (req, res) => {
    const requests = await BloodRequest.getAll();
    res.render('admin/blood-requests', { requests, title: 'Blood Requests' });
});

module.exports.getBloodRequestDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await BloodRequest.getById(id);
    
    if (!request) {
        req.flash('error', 'Blood request not found');
        return res.redirect('/admin/blood-requests');
    }
    
    const hospital = await Hospital.findById(request.hospital_id);
    res.render('admin/blood-request-details', { request, hospital, title: 'Blood Request Details' });
});

module.exports.approveBloodRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Get the blood request details first
    const request = await BloodRequest.getById(id);
    
    if (!request) {
        req.flash('error', 'Blood request not found');
        return res.redirect('/admin/blood-requests');
    }
    
    // Calculate the number of units to subtract (amount_required / 450)
    const unitsToSubtract = Math.ceil(request.amount_required / 450);
    
    // Get the blood inventory for this blood type
    const BloodInventory = require('../models/bloodInventory');
    const inventory = await BloodInventory.getByType(request.blood_type);
    
    if (!inventory || inventory.quantity_available < unitsToSubtract) {
        req.flash('error', `Not enough ${request.blood_type} blood units available in inventory`);
        return res.redirect(`/admin/blood-requests/${id}`);
    }
    
    // Approve the request
    await BloodRequest.approve(id);
    
    // Update the blood inventory - subtract the units
    await BloodInventory.updateQuantity(request.blood_type, -unitsToSubtract);
    
    req.flash('success', `Blood request approved and ${unitsToSubtract} units subtracted from inventory`);
    res.redirect('/admin/blood-requests');
});

module.exports.fulfillBloodRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await BloodRequest.fulfill(id);
    req.flash('success', 'Blood request fulfilled');
    res.redirect('/admin/blood-requests');
});

module.exports.rejectBloodRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    await BloodRequest.reject(id, reason);
    req.flash('success', 'Blood request rejected');
    res.redirect('/admin/blood-requests');
});

module.exports.deleteBloodRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await BloodRequest.delete(id);
    req.flash('success', 'Blood request deleted');
    res.redirect('/admin/blood-requests');
});

// Staff management
module.exports.getAllStaff = catchAsync(async (req, res) => {
    const staff = await User.findByRole('staff');
    res.render('admin/staff', { staff, title: 'Staff Management' });
});

module.exports.renderAddStaffForm = catchAsync(async (req, res) => {
    res.render('admin/add-staff', { title: 'Add Staff Member' });
});

module.exports.addStaff = catchAsync(async (req, res) => {
    const userData = req.body.user;
    userData.role = 'staff';
    await User.register(userData);
    req.flash('success', 'Staff member added successfully');
    res.redirect('/admin/staff');
});

module.exports.getStaffDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    const staff = await User.findById(id);
    
    if (!staff || staff.role !== 'staff') {
        req.flash('error', 'Staff member not found');
        return res.redirect('/admin/staff');
    }
    
    res.render('admin/staff-details', { staff, title: 'Staff Details' });
});

module.exports.updateStaff = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userData = req.body.user;
    await User.update(id, userData);
    req.flash('success', 'Staff member updated successfully');
    res.redirect('/admin/staff');
});

module.exports.deleteStaff = catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.delete(id);
    req.flash('success', 'Staff member deleted successfully');
    res.redirect('/admin/staff');
});

// Campaigns management
module.exports.getAllCampaigns = catchAsync(async (req, res) => {
    const campaigns = await Campaign.getAll();
    res.render('admin/campaigns', { campaigns, title: 'Campaigns Management' });
});

module.exports.renderAddCampaignForm = catchAsync(async (req, res) => {
    res.render('admin/add-campaign', { title: 'Add Campaign' });
});

module.exports.addCampaign = catchAsync(async (req, res) => {
    const campaignData = req.body.campaign;
    await Campaign.create(campaignData);
    req.flash('success', 'Campaign added successfully');
    res.redirect('/admin/campaigns');
});

module.exports.getCampaignDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await Campaign.getById(id);
    
    if (!campaign) {
        req.flash('error', 'Campaign not found');
        return res.redirect('/admin/campaigns');
    }
    
    res.render('admin/campaign-details', { campaign, title: 'Campaign Details' });
});

module.exports.updateCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaignData = req.body.campaign;
    await Campaign.update(id, campaignData);
    req.flash('success', 'Campaign updated successfully');
    res.redirect('/admin/campaigns');
});

module.exports.deleteCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campaign.delete(id);
    req.flash('success', 'Campaign deleted successfully');
    res.redirect('/admin/campaigns');
});

// Reports
module.exports.generateDonorsReport = catchAsync(async (req, res) => {
    const donors = await Donor.findAll();
    res.render('admin/reports/donors', { donors, title: 'Donors Report' });
});

module.exports.generateDonationsReport = catchAsync(async (req, res) => {
    const donations = await Donation.getAll();
    res.render('admin/reports/donations', { donations, title: 'Donations Report' });
});

module.exports.generateInventoryReport = catchAsync(async (req, res) => {
    const inventory = await BloodInventory.getAll();
    res.render('admin/reports/inventory', { inventory, title: 'Inventory Report' });
});

module.exports.generateBloodRequestsReport = catchAsync(async (req, res) => {
    const requests = await BloodRequest.getAll();
    res.render('admin/reports/blood-requests', { requests, title: 'Blood Requests Report' });
});

module.exports.generateCampaignsReport = catchAsync(async (req, res) => {
    const campaigns = await Campaign.getAll();
    res.render('admin/reports/campaigns', { campaigns, title: 'Campaigns Report' });
}); 