const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const { isLoggedIn, isAdminOrStaff, isHospital } = require('../middleware');

// Routes accessible by admin and staff
router.get('/', isLoggedIn, isAdminOrStaff, recipientController.getAllRecipients);
router.get('/search', isLoggedIn, isAdminOrStaff, recipientController.searchRecipients);

// Specific recipient routes
router.get('/:id', isLoggedIn, isAdminOrStaff, recipientController.getRecipientById);
router.post('/', isLoggedIn, isAdminOrStaff, recipientController.createRecipient);
router.put('/:id', isLoggedIn, isAdminOrStaff, recipientController.updateRecipient);
router.delete('/:id', isLoggedIn, isAdminOrStaff, recipientController.deleteRecipient);

// Hospital recipient routes
router.get('/hospital/:hospitalId', isLoggedIn, isHospital, recipientController.getHospitalRecipients);
router.post('/hospital/:hospitalId', isLoggedIn, isHospital, recipientController.addHospitalRecipient);
router.get('/hospital/:hospitalId/:id', isLoggedIn, isHospital, recipientController.getHospitalRecipientById);
router.put('/hospital/:hospitalId/:id', isLoggedIn, isHospital, recipientController.updateHospitalRecipient);
router.delete('/hospital/:hospitalId/:id', isLoggedIn, isHospital, recipientController.deleteHospitalRecipient);

// Transfusion records
router.get('/:id/transfusions', isLoggedIn, isAdminOrStaff, recipientController.getRecipientTransfusions);
router.post('/:id/transfusion', isLoggedIn, isAdminOrStaff, recipientController.addRecipientTransfusion);
router.get('/transfusion/:transfusionId', isLoggedIn, isAdminOrStaff, recipientController.getTransfusionById);
router.put('/transfusion/:transfusionId', isLoggedIn, isAdminOrStaff, recipientController.updateTransfusion);
router.delete('/transfusion/:transfusionId', isLoggedIn, isAdminOrStaff, recipientController.deleteTransfusion);

// Export routes
module.exports = router; 