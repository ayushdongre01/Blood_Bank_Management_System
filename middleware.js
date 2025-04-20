const ExpressError = require('./utils/ExpressError');

const Hospital = require('./models/hospital');
const Donor = require('./models/donor');

// Middleware to add currentUser to all routes
module.exports.setCurrentUser = (req, res, next) => {
    res.locals.currentUser = req.user;
    next();
};

// Middleware to check if user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
};

// Middleware to check if user is admin
module.exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        req.flash('error', 'You do not have permission to access this resource');
        return res.redirect('/');
    }
    next();
};

// Middleware to check if user is staff
module.exports.isStaff = (req, res, next) => {
    if (!req.user || req.user.role !== 'staff') {
        req.flash('error', 'You do not have permission to access this resource');
        return res.redirect('/');
    }
    next();
};

// Middleware to check if user is either admin or staff
module.exports.isAdminOrStaff = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        req.flash('error', 'You do not have permission to access this resource');
        return res.redirect('/');
    }
    next();
};

// Middleware to check if user is donor
module.exports.isDonor = async (req, res, next) => {
    if (!req.user || req.user.role !== 'donor') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect('/');
    }
    
    try {
        const donor = await Donor.findByUserId(req.user.user_id);
        // Make donor available in the request object
        req.donor = donor;
        next();
    } catch (error) {
        console.error('Error checking donor profile:', error);
        next(error);
    }
};

// Middleware to check if user is hospital
module.exports.isHospital = (req, res, next) => {
    if (!req.user || req.user.role !== 'hospital') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect('/');
    }
    next();
};

// Save returnTo URL
module.exports.saveReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
        delete req.session.returnTo;
    }
    next();
};

// Check if user is active
module.exports.isActiveUser = (req, res, next) => {
    if (!req.user.is_active) {
        req.flash('error', 'Your account is inactive. Please contact the administrator.');
        req.logout();
        return res.redirect('/login');
    }
    next();
};

// Donor validation middleware
module.exports.validateDonor = (req, res, next) => {
    // Add validation logic here
    next();
};

// Hospital validation middleware
module.exports.validateHospital = (req, res, next) => {
    // Add validation logic here
    next();
};

// Blood donation validation middleware
module.exports.validateDonation = (req, res, next) => {
    // Add validation logic here
    next();
};

// Blood request validation middleware
module.exports.validateBloodRequest = (req, res, next) => {
    // Add validation logic here
    next();
};

// Campaign validation middleware
module.exports.validateCampaign = (req, res, next) => {
    // Add validation logic here
    next();
};