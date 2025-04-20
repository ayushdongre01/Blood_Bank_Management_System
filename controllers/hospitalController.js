const Hospital = require('../models/hospital');
const User = require('../models/user');
const Recipient = require('../models/recipient');
const catchAsync = require('../utils/catchAsync');

// Admin/Staff: Get all hospitals
module.exports.getAllHospitals = catchAsync(async (req, res) => {
    const hospitals = await Hospital.getAll();
    res.render('hospitals/index', { 
        hospitals, 
        title: 'All Hospitals',
        currentUser: req.user 
    });
});

// Admin/Staff: Search hospitals
module.exports.searchHospitals = catchAsync(async (req, res) => {
    const { query } = req.query;
    let hospitals = [];
    
    if (query) {
        hospitals = await Hospital.search(query);
    } else {
        hospitals = await Hospital.getAll();
    }
    
    res.render('hospitals/index', { 
        hospitals, 
        query, 
        title: 'Search Hospitals',
        currentUser: req.user
    });
});

// Admin/Staff: Get hospital by ID
module.exports.getHospitalById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
        req.flash('error', 'Hospital not found');
        return res.redirect('/hospitals');
    }
    
    res.render('hospitals/show', { hospital, title: hospital.hospital_name });
});

// Hospital: Render hospital dashboard
module.exports.renderHospitalDashboard = catchAsync(async (req, res) => {
    const hospitalId = await getHospitalIdFromUser(req.user.user_id);
    
    if (!hospitalId) {
        req.flash('error', 'Please complete your profile first');
        return res.redirect('/hospitals/profile/edit');
    }
    
    const hospital = await Hospital.findById(hospitalId);
    
    // Get real data from the database
    const BloodInventory = require('../models/bloodInventory');
    
    // Get blood inventory data
    let bloodInventory = [];
    try {
        // Try to get data from blood_inventory table
        const inventoryData = await BloodInventory.getAll();
        
        // If we have inventory data, format it for the template
        if (inventoryData && inventoryData.length > 0) {
            bloodInventory = inventoryData.map(item => ({
                blood_type: item.blood_type,
                units: item.quantity_available || 0,
                status: item.current_status || 'Unknown'
            }));
        } else {
            // If no data found, create placeholder for all blood types
            const allBloodTypes = await BloodInventory.getAllBloodTypes();
            bloodInventory = allBloodTypes.map(type => ({
                blood_type: type,
                units: 0,
                status: 'unavailable'
            }));
        }
    } catch (error) {
        console.error('Error fetching blood inventory:', error);
        // Fallback to placeholder data if there's an error
        bloodInventory = [
            { blood_type: 'A+', units: 15, status: 'Available' },
            { blood_type: 'A-', units: 8, status: 'Moderate' },
            { blood_type: 'B+', units: 12, status: 'Available' },
            { blood_type: 'B-', units: 5, status: 'Moderate' },
            { blood_type: 'AB+', units: 6, status: 'Moderate' },
            { blood_type: 'AB-', units: 3, status: 'Low' },
            { blood_type: 'O+', units: 20, status: 'Available' },
            { blood_type: 'O-', units: 10, status: 'Available' }
        ];
    }
    
    // Get pending blood requests count
    let pendingRequests = 0;
    try {
        const BloodRequest = require('../models/bloodRequest');
        const pendingRequestsData = await BloodRequest.findByHospitalAndStatus(hospitalId, 'pending');
        pendingRequests = pendingRequestsData ? pendingRequestsData.length : 0;
    } catch (error) {
        console.error('Error fetching pending requests:', error);
    }
    
    // Get total recipients count
    let totalRecipients = 0;
    try {
        const Recipient = require('../models/recipient');
        const recipientsData = await Recipient.findByHospital(hospitalId);
        totalRecipients = recipientsData ? recipientsData.length : 0;
    } catch (error) {
        console.error('Error fetching recipients:', error);
    }
    
    // Get recent requests
    let recentRequests = [];
    try {
        const BloodRequest = require('../models/bloodRequest');
        recentRequests = await BloodRequest.findRecentByHospital(hospitalId, 5);
    } catch (error) {
        console.error('Error fetching recent requests:', error);
    }
    
    // Get recent recipients
    let recentRecipients = [];
    try {
        const Recipient = require('../models/recipient');
        recentRecipients = await Recipient.findRecentByHospital(hospitalId, 5);
    } catch (error) {
        console.error('Error fetching recent recipients:', error);
    }
    
    res.render('hospitals/dashboard', { 
        hospital,
        pendingRequests,
        totalRecipients,
        bloodInventory,
        recentRequests,
        recentRecipients,
        title: 'Hospital Dashboard',
        currentUser: req.user
    });
});

// Hospital: Render hospital profile
module.exports.renderHospitalProfile = catchAsync(async (req, res) => {
    let hospital;
    
    // If a hospital_id is provided in the URL, use that instead of the logged-in user
    if (req.params.hospital_id) {
        hospital = await Hospital.findById(req.params.hospital_id);
    } else if (req.user) {
        // If user is logged in, get their hospital profile
        hospital = await Hospital.findByUserId(req.user.user_id);
    } else {
        // No hospital_id in URL and not logged in
        req.flash('error', 'Hospital profile not found');
        return res.redirect('/');
    }
    
    if (!hospital) {
        req.flash('error', 'Hospital profile not found');
        return res.redirect('/');
    }
    
    // Get blood inventory, recent requests, and other relevant data
    // Placeholder data until actual models are implemented
    const bloodInventory = {
        'A+': { available: 10, needed: 15 },
        'A-': { available: 5, needed: 8 },
        'B+': { available: 8, needed: 12 },
        'B-': { available: 3, needed: 5 },
        'AB+': { available: 4, needed: 6 },
        'AB-': { available: 2, needed: 4 },
        'O+': { available: 12, needed: 20 },
        'O-': { available: 6, needed: 15 }
    };
    
    const recentRequests = [];
    const activeCampaigns = [];
    
    res.render('hospitals/profile', { 
        hospital,
        bloodInventory,
        recentRequests,
        activeCampaigns,
        title: 'Hospital Profile',
        currentUser: req.user
    });
});

// Hospital: Render edit profile form
module.exports.renderEditProfile = catchAsync(async (req, res) => {
    const userId = req.user ? req.user.user_id : req.session.userId;
    let hospital = null;
    
    if (userId) {
        hospital = await Hospital.findByUserId(userId);
    }
    
    res.render('hospitals/edit-profile', { 
        hospital, 
        title: 'Edit Hospital Profile',
        currentUser: req.user
    });
});

// Hospital: Update hospital profile
module.exports.updateHospitalProfile = catchAsync(async (req, res) => {
    const userId = req.user ? req.user.user_id : req.session.userId;
    const hospitalData = req.body.hospital;
    
    // Handle profile image upload if present
    if (req.file) {
        hospitalData.profile_image = req.file.path;
    }
    
    let hospital = await Hospital.findByUserId(userId);
    
    if (hospital) {
        // Update existing hospital
        await Hospital.update(hospital.hospital_id, {
            ...hospitalData,
            user_id: userId
        });
    } else {
        // Create new hospital profile
        await Hospital.create({
            ...hospitalData,
            user_id: userId
        });
    }
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/hospitals/profile/dashboard');
});

// Placeholder methods for blood request endpoints
module.exports.renderBloodRequestForm = catchAsync(async (req, res) => {
    // Get the hospital information from the logged-in user
    const hospital = await Hospital.findByUserId(req.user.user_id);
    
    if (!hospital) {
        req.flash('error', 'Please complete your hospital profile first');
        return res.redirect('/hospitals/profile/edit');
    }
    
    // Get preselected blood type from query parameter, if any
    const preselectedBloodType = req.query.blood_type || '';
    
    // Get all recipients for this hospital
    let recipients = [];
    try {
        // If a Recipient model exists, fetch recipients
        const Recipient = require('../models/recipient');
        recipients = await Recipient.findByHospital(hospital.hospital_id);
    } catch (error) {
        console.error('Error fetching recipients:', error);
        // Continue without recipients if there's an error
    }
    
    // Redirect to the new route for blood request form
    return res.redirect('/bloodrequests/new');
});

module.exports.createBloodRequest = catchAsync(async (req, res) => {
    // Redirect to the new endpoint for blood request creation
    return res.redirect('/bloodrequests/new');
});

module.exports.getBloodRequests = catchAsync(async (req, res) => {
    res.render('hospitals/blood-requests', { title: 'Blood Requests' });
});

module.exports.getBloodRequestDetails = catchAsync(async (req, res) => {
    res.render('hospitals/blood-request-details', { title: 'Request Details' });
});

module.exports.updateBloodRequest = catchAsync(async (req, res) => {
    req.flash('success', 'Blood request updated successfully');
    res.redirect('/hospitals/requests');
});

module.exports.cancelBloodRequest = catchAsync(async (req, res) => {
    req.flash('success', 'Blood request cancelled successfully');
    res.redirect('/hospitals/requests');
});

// Placeholder methods for recipient management
module.exports.getRecipients = catchAsync(async (req, res) => {
    try {
        // Get hospital information from the logged-in user
        const hospital = await Hospital.findByUserId(req.user.user_id);
        
        if (!hospital) {
            req.flash('error', 'Please complete your hospital profile first');
            return res.redirect('/hospitals/profile/edit');
        }
        
        // Get recipients for this hospital
        let recipients = [];
        let filter = {};
        
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 10;  // Number of recipients per page
        const offset = (page - 1) * limit;
        
        // Handle search filters if provided
        if (req.query.searchTerm) {
            filter.searchTerm = req.query.searchTerm;
            recipients = await Recipient.search(req.query.searchTerm, hospital.hospital_id);
        } else {
            recipients = await Recipient.findByHospital(hospital.hospital_id);
        }
        
        // Get total count for pagination
        const totalRecipients = recipients.length;
        const totalPages = Math.ceil(totalRecipients / limit);
        
        // Apply pagination to recipients array (simple in-memory pagination)
        const paginatedRecipients = recipients.slice(offset, offset + limit);
        
        // Generate filter query string for pagination links
        const filterParams = [];
        if (filter.searchTerm) filterParams.push(`searchTerm=${encodeURIComponent(filter.searchTerm)}`);
        if (req.query.bloodType) filterParams.push(`bloodType=${encodeURIComponent(req.query.bloodType)}`);
        if (req.query.gender) filterParams.push(`gender=${encodeURIComponent(req.query.gender)}`);
        const filterQueryString = filterParams.length > 0 ? `&${filterParams.join('&')}` : '';
        
        res.render('hospitals/recipients', { 
            recipients: paginatedRecipients,
            filter,
            currentPage: page,
            totalPages,
            filterQueryString,
            title: 'Recipients',
            currentUser: req.user
        });
    } catch (err) {
        console.error('Error fetching recipients:', err);
        req.flash('error', 'Error loading recipients');
        res.redirect('/hospitals/profile/dashboard');
    }
});

module.exports.renderAddRecipientForm = catchAsync(async (req, res) => {
    res.render('hospitals/add-recipient', { title: 'Add Recipient' });
});

module.exports.addRecipient = catchAsync(async (req, res) => {
    try {
        // Get hospital ID from the logged-in user
        const hospital = await Hospital.findByUserId(req.user.user_id);
        
        if (!hospital) {
            req.flash('error', 'Hospital profile not found. Please complete your profile first.');
            return res.redirect('/hospitals/profile/edit');
        }
        
        // Create recipient data object
        const recipientData = {
            name: req.body.name,
            date_of_birth: req.body.date_of_birth || new Date(new Date().setFullYear(new Date().getFullYear() - req.body.age)), // Calculate date from age if provided
            gender: req.body.gender,
            blood_type: req.body.blood_type,
            contact_number: req.body.contact_number, // This will be mapped to contact_no in the model
            email: req.body.email,
            address: req.body.address,
            hospital_id: hospital.hospital_id
        };
        
        // Create the recipient in the database
        const result = await Recipient.create(recipientData);
        
        if (result && result.recipient_id) {
            req.flash('success', 'Recipient added successfully');
            return res.redirect('/hospitals/recipients');
        } else {
            req.flash('error', 'Error adding recipient - invalid data');
            return res.redirect('/hospitals/recipient/new');
        }
    } catch (err) {
        console.error('Error creating recipient:', err);
        req.flash('error', `Error creating recipient: ${err.message}`);
        return res.redirect('/hospitals/recipient/new');
    }
});

module.exports.getRecipientDetails = catchAsync(async (req, res) => {
    res.render('hospitals/recipient-details', { title: 'Recipient Details' });
});

module.exports.updateRecipient = catchAsync(async (req, res) => {
    req.flash('success', 'Recipient updated successfully');
    res.redirect('/hospitals/recipients');
});

module.exports.deleteRecipient = catchAsync(async (req, res) => {
    req.flash('success', 'Recipient deleted successfully');
    res.redirect('/hospitals/recipients');
});

// Helper function to get hospital ID from user ID
async function getHospitalIdFromUser(userId) {
    const hospital = await Hospital.findByUserId(userId);
    return hospital ? hospital.hospital_id : null;
} 