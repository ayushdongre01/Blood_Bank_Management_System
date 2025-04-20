const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, '/public/uploads/') });

const ExpressError = require('./utils/ExpressError');
const pool = require('./utils/database');
const { setCurrentUser } = require('./middleware');

const User = require('./models/user');
const Donor = require('./models/donor');
// Comment out models that don't exist yet or aren't needed
const Campaign = require('./models/campaign');
// const Donation = require('./models/donation');

// Routes - Comment out routes that are causing issues for now
const userRoutes = require('./routes/users');
const donorRoutes = require('./routes/donors');
const hospitalRoutes = require('./routes/hospitals');
// const adminRoutes = require('./routes/admin');
// const bloodInventoryRoutes = require('./routes/bloodInventory');
// const donationRoutes = require('./routes/donations');
const campaignRoutes = require('./routes/campaigns');
const staffRoutes = require('./routes/staff');

const app = express();

// EJS setup - use ejsMate as the engine for ejs files
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Log when templates are being rendered for debugging
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
        console.log(`Rendering view: ${view}`);
        originalRender.call(this, view, options, callback);
    };
    next();
});
// No need for express-layouts since ejsMate provides layout functionality
// app.use(expressLayouts);
// app.set('layout', 'layouts/boilerplate');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session store
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Flash messages
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
// Use the authenticate method directly, not as a callback
passport.use(new LocalStrategy((username, password, done) => {
    User.authenticate(username, password, done);
}));
passport.serializeUser((user, done) => {
    User.serializeUser(user, done);
});
passport.deserializeUser((id, done) => {
    User.deserializeUser(id, done);
});

// Set currentUser for all routes
app.use(setCurrentUser);

// Global variables middleware
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.title = 'Blood Bank Management System'; // Set default title
    next();
});

// Routes
app.use('/', userRoutes);
app.use('/donors', donorRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/staff', staffRoutes);
app.use('/inventory', require('./routes/inventory'));
app.use('/donationrequests', require('./routes/donationRequests'));
app.use('/bloodrequests', require('./routes/bloodRequests'));
app.use('/test', require('./routes/test'));

app.get('/donors/profile/dashboard', async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }

        // Get donor object (either from middleware or fetch fresh)
        const donor = req.donor || await Donor.findByUserId(req.user.user_id);

        // Function to check if donor profile is incomplete
        function isProfileIncomplete(donor) {
            // Customize this according to your schema
            return !donor.full_name || !donor.age || !donor.blood_group || !donor.address;
        }

        // If donor doesn't exist or has missing info, redirect to edit-profile
        if (!donor || isProfileIncomplete(donor)) {
            req.flash('info', 'Please complete your donor profile first');
            return res.redirect('/donors/edit-profile');
        }

        // Fetch actual donation history and statistics
        const donationHistory = await Donor.getDonationHistory(donor.donor_id).catch(err => {
            console.error('Error fetching donation history:', err);
            return [];
        });
        
        const donationStats = await Donor.getTotalDonations(donor.donor_id).catch(err => {
            console.error('Error fetching donation stats:', err);
            return {
                count: 0,
                lastDonation: null,
                total_volume_ml: 0
            };
        });
        
        const upcomingCampaigns = [];
        const pendingRequests = [];

        // Render dashboard view
        res.render('donors/dashboard', {
            currentUser: req.user, // For navbar or auth display
            donor,
            donationHistory,
            donationStats,
            upcomingCampaigns,
            pendingRequests,
            title: 'Donor Dashboard'
        });

    } catch (err) {
        next(err); // Let error middleware handle any issues
    }
});

app.get('/donors/edit-profile', async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }

        const donor = await Donor.findByUserId(req.user.user_id);

        res.render('donors/edit-profile', {
            donor: donor || {}, // pre-fill if exists
            currentUser: req.user,
            title: 'Edit Donor Profile'
        });
    } catch (err) {
        next(err);
    }
});

// Simple route to display donor profile
app.get('/donors/profile', async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }

        // Get donor object (either from middleware or fetch fresh)
        const donor = req.donor || await Donor.findByUserId(req.user.user_id);

        if (!donor) {
            req.flash('error', 'Donor profile not found');
            return res.redirect('/');
        }

        // Fetch actual donation history and statistics
        const donationHistory = await Donor.getDonationHistory(donor.donor_id).catch(err => {
            console.error('Error fetching donation history:', err);
            return [];
        });
        
        const donationStats = await Donor.getTotalDonations(donor.donor_id).catch(err => {
            console.error('Error fetching donation stats:', err);
            return {
                count: 0,
                lastDonation: null,
                total_volume_ml: 0
            };
        });

        // Render profile view
        res.render('donors/profile', {
            currentUser: req.user,
            donor,
            donationHistory,
            donationStats,
            title: 'Donor Profile'
        });
    } catch (err) {
        next(err);
    }
});

// Route to view any donor's profile by ID
app.get('/donors/profile/:donor_id', async (req, res, next) => {
    try {
        const { donor_id } = req.params;
        
        // Find donor by ID
        const donor = await Donor.findById(donor_id);
        
        if (!donor) {
            req.flash('error', 'Donor profile not found');
            return res.redirect('/');
        }
        
        // Fetch actual donation history and statistics
        const donationHistory = await Donor.getDonationHistory(donor_id).catch(err => {
            console.error('Error fetching donation history:', err);
            return [];
        });
        
        const donationStats = await Donor.getTotalDonations(donor_id).catch(err => {
            console.error('Error fetching donation stats:', err);
            return {
                count: 0,
                lastDonation: null,
                total_volume_ml: 0
            };
        });
        
        // Render profile view
        res.render('donors/profile', {
            currentUser: req.user,
            donor,
            donationHistory,
            donationStats,
            title: 'Donor Profile'
        });
    } catch (err) {
        next(err);
    }
});

// Simple route to display hospital profile
app.get('/hospitals/profile', async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }

        // Get hospital from user ID
        const Hospital = require('./models/hospital');
        const hospital = await Hospital.findByUserId(req.user.user_id);

        if (!hospital) {
            req.flash('error', 'Hospital profile not found');
            return res.redirect('/');
        }

        // Placeholder data for blood inventory
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

        // Make sure all necessary fields exist to prevent template errors
        const safeHospital = {
            ...hospital,
            hospital_name: hospital.hospital_name || 'Unknown Hospital',
            hospital_address: hospital.hospital_address || '',
            contact_no: hospital.contact_no || '',
            email: hospital.email || '',
            website: hospital.website || '',
            description: hospital.description || '',
            hospital_type: hospital.hospital_type || 'General Hospital',
            profile_image: hospital.profile_image || null
        };

        // Render profile view
        res.render('hospitals/profile', {
            currentUser: req.user,
            hospital: safeHospital,
            bloodInventory,
            recentRequests,
            activeCampaigns,
            title: 'Hospital Profile'
        });
    } catch (err) {
        next(err);
    }
});

// Route to view any hospital's profile by ID
app.get('/hospitals/profile/:hospital_id', async (req, res, next) => {
    try {
        const { hospital_id } = req.params;
        
        // Get hospital model and find by ID
        const Hospital = require('./models/hospital');
        const hospital = await Hospital.findById(hospital_id);
        
        if (!hospital) {
            req.flash('error', 'Hospital profile not found');
            return res.redirect('/');
        }
        
        // Placeholder data for blood inventory
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
        
        // Make sure all necessary fields exist to prevent template errors
        const safeHospital = {
            ...hospital,
            hospital_name: hospital.hospital_name || 'Unknown Hospital',
            hospital_address: hospital.hospital_address || '',
            contact_no: hospital.contact_no || '',
            email: hospital.email || '',
            website: hospital.website || '',
            description: hospital.description || '',
            hospital_type: hospital.hospital_type || 'General Hospital',
            profile_image: hospital.profile_image || null
        };
        
        // Render profile view
        res.render('hospitals/profile', {
            currentUser: req.user,
            hospital: safeHospital,
            bloodInventory,
            recentRequests,
            activeCampaigns,
            title: 'Hospital Profile'
        });
    } catch (err) {
        next(err);
    }
});

// ✅ PUT route for saving donor profile
app.put('/donors/profile', upload.single('profile_image'), async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }

        const {
            full_name,
            age,
            gender,
            blood_group,
            address,
            contact_number,
            city,
            state,
            pin_code
        } = req.body.donor;

        const profile_image = req.file ? `/uploads/${req.file.filename}` : null;

        const existingDonor = await Donor.findByUserId(req.user.user_id);

        if (existingDonor) {
            // Update donor
            await Donor.updateByUserId(req.user.user_id, {
                full_name, age, gender, blood_group,
                address, contact_number, city, state, pin_code,
                ...(profile_image && { profile_image })
            });
        } else {
            // Insert new donor
            await Donor.create({
                user_id: req.user.user_id,
                full_name, age, gender, blood_group,
                address, contact_number, city, state, pin_code,
                profile_image
            });
        }

        req.flash('success', 'Profile updated successfully!');
        res.redirect('/donors/profile/dashboard');
    } catch (err) {
        next(err);
    }
});

// app.use('/hospitals', hospitalRoutes);
// app.use('/admin', adminRoutes);
// app.use('/blood-inventory', bloodInventoryRoutes);
// app.use('/donations', donationRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/staff', staffRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

// 404 Route
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err, title: 'Error' });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
