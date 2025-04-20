const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { isLoggedIn, isAdminOrStaff } = require('../middleware');

// Public routes
router.get('/', campaignController.getAllCampaigns);
router.get('/upcoming', campaignController.getUpcomingCampaigns);
router.get('/ongoing', campaignController.getOngoingCampaigns);
router.get('/completed', campaignController.getCompletedCampaigns);
router.get('/:id', campaignController.getCampaignById);

// Campaign form routes
router.get('/upcoming/new', isLoggedIn, isAdminOrStaff, campaignController.renderUpcomingCampaignForm);
router.get('/completed/new', isLoggedIn, isAdminOrStaff, campaignController.renderCompletedCampaignForm);
router.post('/upcoming', isLoggedIn, isAdminOrStaff, campaignController.createUpcomingCampaign);
router.post('/completed', isLoggedIn, isAdminOrStaff, campaignController.createCompletedCampaign);

// Admin and staff routes
router.post('/', isLoggedIn, isAdminOrStaff, campaignController.createCampaign);
router.put('/:id', isLoggedIn, isAdminOrStaff, campaignController.updateCampaign);
router.delete('/:id', isLoggedIn, isAdminOrStaff, campaignController.deleteCampaign);
router.put('/:id/status', isLoggedIn, isAdminOrStaff, campaignController.updateCampaignStatus);

// Campaign donations
router.get('/:id/donations', isLoggedIn, isAdminOrStaff, campaignController.getCampaignDonations);
router.post('/:id/donation', isLoggedIn, isAdminOrStaff, campaignController.addCampaignDonation);

// Export routes
module.exports = router; 