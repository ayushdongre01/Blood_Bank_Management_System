const express = require('express');
const router = express.Router();

// Test route for rendering show.ejs directly
router.get('/test-show', (req, res) => {
    console.log('DEBUG: Directly rendering show.ejs with test data');
    // Create a dummy request object with all required fields
    const request = {
        request_id: 9999,
        recipient_id: 1,
        hospital_id: 1,
        blood_type: 'O+',
        amount_required: 450,
        component: 'Whole Blood',
        request_date: new Date(),
        required_date: new Date(),
        request_status: 'pending',
        notes: 'This is a test request',
        priority: 'High',
        recipient_name: 'Test Recipient',
        recipient_blood_type: 'O+',
        recipient_gender: 'Male',
        recipient_date_of_birth: new Date('1990-01-01'),
        recipient_contact_no: '1234567890',
        recipient_email: 'test@example.com',
        recipient_address: '123 Test St',
        hospital_name: 'Test Hospital'
    };
    
    res.render('bloodRequests/show', {
        request,
        title: 'Test Blood Request Details',
        currentUser: req.user || null,
        isAdmin: true,
        isHospitalUser: true,
        isOwner: true
    });
});

module.exports = router; 