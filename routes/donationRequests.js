const express = require('express');
const router = express.Router();
const donationRequestController = require('../controllers/donationRequestController');
const { isLoggedIn, isAdminOrStaff } = require('../middleware');

// Donation requests routes for admin/staff
router.get('/', isLoggedIn, isAdminOrStaff, donationRequestController.getAllRequests);
router.get('/:id', isLoggedIn, isAdminOrStaff, donationRequestController.getRequestDetails);
router.post('/:id/approve', isLoggedIn, isAdminOrStaff, donationRequestController.approveRequest);
router.post('/:id/reject', isLoggedIn, isAdminOrStaff, donationRequestController.rejectRequest);
router.post('/:id/schedule', isLoggedIn, isAdminOrStaff, donationRequestController.scheduleRequest);
router.post('/:id/complete', isLoggedIn, isAdminOrStaff, donationRequestController.completeRequest);

module.exports = router;