const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middleware');

// Admin dashboard
router.get('/dashboard', isLoggedIn, isAdmin, adminController.renderDashboard);

// Inventory management
router.get('/inventory', isLoggedIn, isAdmin, adminController.getInventory);
router.get('/inventory/add', isLoggedIn, isAdmin, adminController.renderAddInventoryForm);
router.post('/inventory', isLoggedIn, isAdmin, adminController.addInventory);
router.put('/inventory/:id', isLoggedIn, isAdmin, adminController.updateInventory);
router.delete('/inventory/:id', isLoggedIn, isAdmin, adminController.deleteInventory);

// Donation requests management
router.get('/donation-requests', isLoggedIn, isAdmin, adminController.getDonationRequests);
router.get('/donation-request/:id', isLoggedIn, isAdmin, adminController.getDonationRequestDetails);
router.put('/donation-request/:id/approve', isLoggedIn, isAdmin, adminController.approveDonationRequest);
router.put('/donation-request/:id/reject', isLoggedIn, isAdmin, adminController.rejectDonationRequest);
router.delete('/donation-request/:id', isLoggedIn, isAdmin, adminController.deleteDonationRequest);

// Blood requests management
router.get('/blood-requests', isLoggedIn, isAdmin, adminController.getBloodRequests);
router.get('/blood-request/:id', isLoggedIn, isAdmin, adminController.getBloodRequestDetails);
router.put('/blood-request/:id/approve', isLoggedIn, isAdmin, adminController.approveBloodRequest);
router.put('/blood-request/:id/fulfill', isLoggedIn, isAdmin, adminController.fulfillBloodRequest);
router.put('/blood-request/:id/reject', isLoggedIn, isAdmin, adminController.rejectBloodRequest);
router.delete('/blood-request/:id', isLoggedIn, isAdmin, adminController.deleteBloodRequest);

// Staff management
router.get('/staff', isLoggedIn, isAdmin, adminController.getAllStaff);
router.get('/staff/add', isLoggedIn, isAdmin, adminController.renderAddStaffForm);
router.post('/staff', isLoggedIn, isAdmin, adminController.addStaff);
router.get('/staff/:id', isLoggedIn, isAdmin, adminController.getStaffDetails);
router.put('/staff/:id', isLoggedIn, isAdmin, adminController.updateStaff);
router.delete('/staff/:id', isLoggedIn, isAdmin, adminController.deleteStaff);

// Campaigns management
router.get('/campaigns', isLoggedIn, isAdmin, adminController.getAllCampaigns);
router.get('/campaign/add', isLoggedIn, isAdmin, adminController.renderAddCampaignForm);
router.post('/campaign', isLoggedIn, isAdmin, adminController.addCampaign);
router.get('/campaign/:id', isLoggedIn, isAdmin, adminController.getCampaignDetails);
router.put('/campaign/:id', isLoggedIn, isAdmin, adminController.updateCampaign);
router.delete('/campaign/:id', isLoggedIn, isAdmin, adminController.deleteCampaign);

// Reports
router.get('/reports/donors', isLoggedIn, isAdmin, adminController.generateDonorsReport);
router.get('/reports/donations', isLoggedIn, isAdmin, adminController.generateDonationsReport);
router.get('/reports/inventory', isLoggedIn, isAdmin, adminController.generateInventoryReport);
router.get('/reports/blood-requests', isLoggedIn, isAdmin, adminController.generateBloodRequestsReport);
router.get('/reports/campaigns', isLoggedIn, isAdmin, adminController.generateCampaignsReport);

// Export routes
module.exports = router; 