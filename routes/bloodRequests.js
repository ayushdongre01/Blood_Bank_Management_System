const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin, isHospital } = require('../middleware');
const Hospital = require('../models/hospital');
const Recipient = require('../models/recipient');
const BloodRequest = require('../models/bloodRequest');
const User = require('../models/user');
const BloodInventory = require('../models/bloodInventory');
const path = require('path');
const catchAsync = require('../utils/catchAsync');

// Utility function to determine if user is admin
const checkUserType = async (req) => {
    let isAdmin = false;
    let isHospitalUser = false;
    
    if (req.user) {
        isAdmin = req.user.role === 'admin';
        isHospitalUser = req.user.role === 'hospital';
    }
    
    return { isAdmin, isHospitalUser };
};

// Show all blood requests
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const { isAdmin, isHospitalUser } = await checkUserType(req);
        let requests;
        
        if (isAdmin) {
            // Admins see all requests
            requests = await BloodRequest.getAll();
        } else if (isHospitalUser) {
            // Hospitals see only their requests
            const hospital = await Hospital.findByUserId(req.user.user_id);
            requests = hospital ? await BloodRequest.findByHospitalId(hospital.hospital_id) : [];
        } else {
            // Regular users see approved requests only
            requests = await BloodRequest.findByStatus('approved');
        }
        
        res.render('bloodRequests/index', { 
            requests, 
            title: 'Blood Requests',
            currentUser: req.user,
            isAdmin,
            isHospitalUser
        });
    } catch (err) {
        console.error('Error getting blood requests:', err);
        req.flash('error', 'Error loading blood requests');
        res.redirect('/');
    }
});

// Show form to create a new blood request (for hospitals only)
router.get('/new', isLoggedIn, isHospital, async (req, res) => {
    try {
        // Get hospital information
        const hospital = await Hospital.findByUserId(req.user.user_id);
        
        if (!hospital) {
            req.flash('error', 'Please complete your hospital profile first');
            return res.redirect('/hospitals/profile/edit');
        }
        
        // Get all recipients for this hospital
        let recipients = [];
        try {
            // Attempt to get recipients filtered by hospital
            recipients = await Recipient.findByHospital(hospital.hospital_id);
            
            // If that fails or returns empty, get all recipients
            if (!recipients || recipients.length === 0) {
                recipients = await Recipient.findAll();
            }
        } catch (error) {
            console.error('Error fetching recipients:', error);
            // Try to get all recipients if hospital-specific fetch fails
            try {
                recipients = await Recipient.findAll();
            } catch (innerError) {
                console.error('Error fetching all recipients:', innerError);
                recipients = [];
            }
        }
        
        res.render('bloodRequests/new', {
            hospital,
            recipients,
            title: 'New Blood Request',
            currentUser: req.user
        });
    } catch (err) {
        console.error('Error loading blood request form:', err);
        req.flash('error', 'Error loading blood request form');
        res.redirect('/bloodrequests');
    }
});

// Create a new blood request
router.post('/', isLoggedIn, catchAsync(async (req, res) => {
    const { recipient_id, new_recipient_toggle, blood_type, component, quantity_ml, required_date, notes, hospital_id, priority } = req.body;
    let recipientId = recipient_id;
    
    try {
        console.log('Creating blood request with data:', req.body);
        
        // Check if we're creating a new recipient
        if (new_recipient_toggle === 'on') {
            const recipientData = req.body.recipient;
            // Ensure hospital_id is set for the recipient
            if (!recipientData.hospital_id && hospital_id) {
                recipientData.hospital_id = hospital_id;
            }
            
            console.log('Creating new recipient:', recipientData);
            
            // Create recipient
            const recipient = await Recipient.create(recipientData);
            recipientId = recipient.recipient_id;
            console.log('New recipient created with ID:', recipientId);
        }
        
        // Prepare request data
        const requestData = {
            hospital_id: hospital_id,
            blood_type,
            component,
            amount_required: quantity_ml,
            request_date: new Date(),
            required_date,
            notes,
            priority,
            request_status: 'pending'
        };
        
        // If we have a recipient ID, add it to the request data
        if (recipientId) {
            requestData.recipient_id = recipientId;
            
            // If this is a new recipient, add the receiver_type
            if (new_recipient_toggle === 'on' && req.body.recipient) {
                requestData.receiver_type = req.body.recipient.receiver_type;
            }
        } else {
            // Handle general request without specific recipient
            console.log('Creating general blood request without specific recipient');
        }
        
        console.log('Creating blood request with data:', requestData);
        
        // Create blood request
        const request = await BloodRequest.create(requestData);
        console.log('Blood request created with ID:', request.request_id);
        
        req.flash('success', 'Blood request created successfully!');
        return res.redirect(`/bloodrequests/${request.request_id}`);
    } catch (error) {
        console.error('Error creating blood request:', error);
        req.flash('error', `Failed to create blood request: ${error.message}`);
        return res.redirect('/bloodrequests/new');
    }
}));

// Show a single blood request
router.get('/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`DEBUG: Fetching blood request with ID: ${id}`);
        
        // Make sure ID is a valid number
        const requestId = parseInt(id);
        if (isNaN(requestId)) {
            console.log(`DEBUG: Invalid request ID: ${id}`);
            req.flash('error', 'Invalid blood request ID');
            return res.redirect('/bloodrequests');
        }
        
        const request = await BloodRequest.getById(requestId);
        console.log(`DEBUG: Request data:`, JSON.stringify(request, null, 2));
        
        if (!request) {
            console.log(`DEBUG: Blood request with ID ${id} not found`);
            req.flash('error', 'Blood request not found');
            return res.redirect('/bloodrequests');
        }
        
        const { isAdmin, isHospitalUser } = await checkUserType(req);
        console.log(`DEBUG: User types - isAdmin: ${isAdmin}, isHospitalUser: ${isHospitalUser}`);
        
        // Check if hospital user is the owner
        let isOwner = false;
        if (isHospitalUser) {
            const hospital = await Hospital.findByUserId(req.user.user_id);
            isOwner = hospital && hospital.hospital_id === request.hospital_id;
            console.log(`DEBUG: Hospital user is owner: ${isOwner}`);
        }
        
        // Ensure case-insensitive render by using direct path to the EJS template
        console.log(`DEBUG: Rendering show template with request ID: ${request.request_id}`);
        console.log(`DEBUG: Current directory: ${__dirname}`);
        
        // NOTE: If the path join approach doesn't work, try direct string template
        // res.render('bloodRequests/show', {
        return res.render('bloodRequests/show', {
            request,
            title: 'Blood Request Details',
            currentUser: req.user,
            isAdmin,
            isHospitalUser,
            isOwner
        });
    } catch (err) {
        console.error('Error getting blood request details:', err);
        req.flash('error', 'Error loading blood request details: ' + err.message);
        return res.redirect('/bloodrequests');
    }
});

// Approve a blood request (admin only)
router.post('/:id/approve', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { approval_reason } = req.body;
        
        // Get the blood request details first
        const request = await BloodRequest.getById(id);
        
        if (!request) {
            req.flash('error', 'Blood request not found');
            return res.redirect('/bloodrequests');
        }
        
        // Calculate the number of units to subtract (amount_required / 450)
        const unitsToSubtract = Math.ceil(request.amount_required / 450);
        
        // Get the blood inventory for this blood type
        const inventory = await BloodInventory.getByType(request.blood_type);
        
        if (!inventory || inventory.quantity_available < unitsToSubtract) {
            req.flash('error', `Not enough ${request.blood_type} blood units available in inventory`);
            return res.redirect(`/bloodrequests/${id}`);
        }
        
        // Approve the request
        await BloodRequest.approve(id);
        
        // Update the blood inventory - subtract the units
        await BloodInventory.updateQuantity(request.blood_type, -unitsToSubtract);
        
        // Update notes with approval reason if provided
        if (approval_reason) {
            const updatedNotes = request.notes 
                ? `${request.notes}\n\nApproval reason: ${approval_reason}` 
                : `Approval reason: ${approval_reason}`;
            
            await BloodRequest.update(id, { notes: updatedNotes });
        }
        
        req.flash('success', `Blood request approved and ${unitsToSubtract} units subtracted from inventory`);
        res.redirect('/bloodrequests');
    } catch (err) {
        console.error('Error approving blood request:', err);
        req.flash('error', 'Error approving blood request');
        res.redirect('/bloodrequests');
    }
});

// Reject a blood request (admin only)
router.post('/:id/reject', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        
        await BloodRequest.reject(id, rejection_reason || 'No reason provided');
        
        req.flash('success', 'Blood request rejected');
        res.redirect('/bloodrequests');
    } catch (err) {
        console.error('Error rejecting blood request:', err);
        req.flash('error', 'Error rejecting blood request');
        res.redirect('/bloodrequests');
    }
});

// Cancel a blood request (hospital only - must be the owner)
router.post('/:id/cancel', isLoggedIn, isHospital, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Attempting to cancel blood request with ID: ${id}`);
        
        const request = await BloodRequest.getById(id);
        
        if (!request) {
            console.log(`Blood request with ID ${id} not found`);
            req.flash('error', 'Blood request not found');
            return res.redirect('/bloodrequests');
        }
        
        console.log(`Found request: ${JSON.stringify(request, null, 2)}`);
        
        // Verify ownership
        const hospital = await Hospital.findByUserId(req.user.user_id);
        console.log(`Hospital for user ${req.user.user_id}: ${JSON.stringify(hospital, null, 2)}`);
        
        if (!hospital || hospital.hospital_id !== request.hospital_id) {
            console.log(`Permission denied. Hospital ID: ${hospital ? hospital.hospital_id : 'not found'}, Request's hospital ID: ${request.hospital_id}`);
            req.flash('error', 'You do not have permission to cancel this request');
            return res.redirect('/bloodrequests');
        }
        
        console.log(`Calling BloodRequest.delete with ID: ${id}`);
        await BloodRequest.delete(id);
        
        req.flash('success', 'Blood request cancelled successfully');
        res.redirect('/bloodrequests');
    } catch (err) {
        console.error('Error cancelling blood request:', err);
        console.error('Error stack:', err.stack);
        req.flash('error', `Error cancelling blood request: ${err.message}`);
        res.redirect('/bloodrequests');
    }
});

module.exports = router; 