const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { isLoggedIn, isAdminOrStaff, isDonor } = require('../middleware');

// Routes accessible by admin and staff
router.get('/', isLoggedIn, isAdminOrStaff, donationController.getAllDonations);
router.get('/pending', isLoggedIn, isAdminOrStaff, donationController.getPendingDonations);
router.get('/completed', isLoggedIn, isAdminOrStaff, donationController.getCompletedDonations);
router.get('/rejected', isLoggedIn, isAdminOrStaff, donationController.getRejectedDonations);

// Specific donation routes
router.get('/:id', isLoggedIn, isAdminOrStaff, donationController.getDonationById);
router.post('/', isLoggedIn, isAdminOrStaff, donationController.createDonation);
router.put('/:id', isLoggedIn, isAdminOrStaff, donationController.updateDonation);
router.put('/:id/status', isLoggedIn, isAdminOrStaff, donationController.updateDonationStatus);
router.delete('/:id', isLoggedIn, isAdminOrStaff, donationController.deleteDonation);

// Screening management
router.post('/:id/screening', isLoggedIn, isAdminOrStaff, donationController.addScreening);
router.put('/:id/screening/:screeningId', isLoggedIn, isAdminOrStaff, donationController.updateScreening);

// Routes for donors
router.get('/donor/:donorId', isLoggedIn, isDonor, donationController.getDonorDonations);
router.get('/donor/:donorId/:id', isLoggedIn, isDonor, donationController.getDonorDonationById);

// Donation request routes
router.get('/requests', isLoggedIn, isAdminOrStaff, donationController.getDonationRequests);
router.put('/requests/:id/approve', isLoggedIn, isAdminOrStaff, donationController.approveDonationRequest);
router.put('/requests/:id/reject', isLoggedIn, isAdminOrStaff, donationController.rejectDonationRequest);

// Donation certificates
router.get('/:id/certificate', isLoggedIn, donationController.generateDonationCertificate);

// Export routes
module.exports = router; 