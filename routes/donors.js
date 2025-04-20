const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { isLoggedIn, isDonor, isAdmin, isStaff } = require('../middleware');
const { donorUpload } = require('../cloudinary');

// Check if user is either admin or staff
const isAdminOrStaff = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        req.flash('error', 'You do not have permission to access this resource');
        return res.redirect('/');
    }
    next();
};

// Donor routes accessible by anyone
router.get('/', donorController.getAllDonors);
router.get('/search', donorController.searchDonors);

// Donor profile routes (for donor users)
router.get('/profile/dashboard', isLoggedIn, isDonor, donorController.renderDonorDashboard);
router.get('/profile/donations', isLoggedIn, isDonor, donorController.getDonationHistory);
router.get('/profile/:donor_id', donorController.renderDonorProfile);
router.get('/profile', donorController.renderDonorProfile);
// Allow access to edit profile during registration
router.get('/edit-profile', donorController.renderEditProfile);
router.get('/profile/edit', donorController.renderEditProfile); // Keep for backward compatibility
router.put('/profile', donorUpload.single('profile_image'), donorController.updateDonorProfile);

// Donation request routes (for donor users)
router.get('/donation/request', isLoggedIn, isDonor, donorController.renderDonationRequestForm);
router.post('/donation/request', isLoggedIn, isDonor, donorController.createDonationRequest);
router.get('/donation/requests', isLoggedIn, isDonor, donorController.getDonationRequests);
router.get('/donation/request/:id', isLoggedIn, isDonor, donorController.getDonationRequestDetails);
router.post('/donation/request/:id/cancel', isLoggedIn, isDonor, donorController.cancelDonationRequest);

// Certificate routes (for donor users)
router.get('/certificate/:id', isLoggedIn, isDonor, donorController.getDonationCertificate);
router.get('/certificate/:id/print', isLoggedIn, isDonor, donorController.getPrintableDonationCertificate);

// Admin/Staff specific routes
router.get('/:id', isLoggedIn, isAdminOrStaff, donorController.getDonorById);

// Export routes
module.exports = router; 