const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { isLoggedIn, isHospital, isAdmin, isStaff } = require('../middleware');
const { hospitalUpload } = require('../cloudinary');

// Hospital routes accessible by anyone
router.get('/', hospitalController.getAllHospitals);
router.get('/search', hospitalController.searchHospitals);

// Hospital profile routes (for hospital users)
router.get('/profile/dashboard', isLoggedIn, isHospital, hospitalController.renderHospitalDashboard);
// Allow access to edit profile during registration
router.get('/profile/edit', hospitalController.renderEditProfile);
router.get('/profile/:hospital_id', hospitalController.renderHospitalProfile);
router.get('/profile', hospitalController.renderHospitalProfile);
router.put('/profile', hospitalUpload.single('profile_image'), hospitalController.updateHospitalProfile);

// Blood request routes (for hospital users)
router.get('/request/new', isLoggedIn, isHospital, (req, res) => res.redirect('/bloodrequests/new'));
router.post('/request', isLoggedIn, isHospital, (req, res) => res.redirect('/bloodrequests/new'));
router.get('/requests', isLoggedIn, isHospital, (req, res) => res.redirect('/bloodrequests'));
router.get('/request/:id', isLoggedIn, isHospital, (req, res) => {
    const { id } = req.params;
    res.redirect(`/bloodrequests/${id}`);
});
router.put('/request/:id', isLoggedIn, isHospital, (req, res) => {
    const { id } = req.params;
    res.redirect(`/bloodrequests/${id}`);
});
router.delete('/request/:id', isLoggedIn, isHospital, (req, res) => {
    const { id } = req.params;
    res.redirect(`/bloodrequests/${id}/cancel`);
});

// Recipient management (for hospital users)
router.get('/recipients', isLoggedIn, isHospital, hospitalController.getRecipients);
router.get('/recipient/new', isLoggedIn, isHospital, hospitalController.renderAddRecipientForm);
router.post('/recipient', isLoggedIn, isHospital, hospitalController.addRecipient);
router.get('/recipient/:id', isLoggedIn, isHospital, hospitalController.getRecipientDetails);
router.put('/recipient/:id', isLoggedIn, isHospital, hospitalController.updateRecipient);
router.delete('/recipient/:id', isLoggedIn, isHospital, hospitalController.deleteRecipient);

// Admin/Staff specific routes
router.get('/:id', isLoggedIn, isStaff, hospitalController.getHospitalById);

// Export routes
module.exports = router; 