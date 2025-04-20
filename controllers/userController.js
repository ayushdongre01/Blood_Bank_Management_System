const User = require('../models/user');
const Donor = require('../models/donor');
const Hospital = require('../models/hospital');
const Staff = require('../models/staff');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../utils/database');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Render registration page
module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

// Register new user
module.exports.register = catchAsync(async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if username or email already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            req.flash('error', 'Username already exists');
            return res.redirect('/register');
        }
        
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            req.flash('error', 'Email already exists');
            return res.redirect('/register');
        }
        
        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Create user with a custom user_id
            const userData = { username, email, password, role };
            const newUser = await User.createWithConnection(connection, userData);
            
            // Create profile based on role
            if (role === 'donor') {
                // Extract donor fields from request body
                const donorData = {
                    donor_id: newUser.user_id, // Use the same ID
                    name: req.body.name,
                    gender: req.body.gender,
                    date_of_birth: req.body.date_of_birth,
                    blood_type: req.body.blood_type,
                    address: req.body.address,
                    email: req.body.email,
                    contact_no: req.body.contact_no
                };
                
                // Add profile image if uploaded via Cloudinary
                if (req.cloudinaryUrl) {
                    donorData.profile_image = req.cloudinaryUrl;
                }
                
                // Create donor profile using the same ID as user_id
                await Donor.createWithConnection(connection, donorData);
            } else if (role === 'hospital') {
                // Extract hospital fields from request body
                const hospitalData = {
                    hospital_id: newUser.user_id, // Use the same ID
                    hospital_name: req.body.hospital_name,
                    hospital_address: req.body.hospital_address,
                    email: req.body.email,
                    contact_no: req.body.contact_no
                };
                
                // Add profile image if uploaded via Cloudinary
                if (req.cloudinaryUrl) {
                    hospitalData.profile_image = req.cloudinaryUrl;
                }
                
                // Create hospital profile using the same ID as user_id
                await Hospital.createWithConnection(connection, hospitalData);
            }
            
            // Commit transaction
            await connection.commit();
            
            // Log the user in immediately after registration
            req.login(newUser, (err) => {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('/login');
                }
                
                if (role === 'donor') {
                    req.flash('success', 'Welcome to Blood Bank! Your donor account has been created.');
                    return res.redirect('/donors/dashboard');
                } else if (role === 'hospital') {
                    req.flash('success', 'Welcome to Blood Bank! Your hospital account has been created.');
                    return res.redirect('/hospitals/dashboard');
                } else {
                    // For admin and staff roles
                    req.flash('success', 'Welcome to Blood Bank Management System!');
                    return res.redirect('/');
                }
            });
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection
            connection.release();
        }
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register');
    }
});

// Render login page
module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

// Login user
module.exports.login = catchAsync(async (req, res) => {
    const redirectUrl = res.locals.returnTo || '/';
    
    // Set last login timestamp
    await User.updateLastLogin(req.user.user_id);
    
    // Redirect based on role
    if (req.user.role === 'admin') {
        return res.redirect('/');
    } else if (req.user.role === 'donor') {
        return res.redirect('/donors/profile/dashboard');
    } else if (req.user.role === 'hospital') {
        return res.redirect('/hospitals/profile/dashboard');
    } else if (req.user.role === 'staff') {
        return res.redirect('/');
    }
    
    req.flash('success', 'Welcome back!');
    res.redirect(redirectUrl);
});

// Logout user
module.exports.logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
};

// Render forgot password page
module.exports.renderForgotPassword = (req, res) => {
    res.render('users/forgot-password');
};

// Process forgot password request
module.exports.forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
        req.flash('error', 'No account with that email exists');
        return res.redirect('/forgot-password');
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour
    
    // Save token in database
    await User.saveResetToken(user.user_id, resetToken, resetTokenExpires);
    
    // Send email
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USERNAME,
        subject: 'Blood Bank Password Reset',
        text: `You are receiving this because you (or someone else) requested the reset of the password for your account.\n\n
               Please click on the following link, or paste this into your browser to complete the process:\n\n
               ${resetUrl}\n\n
               If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    
    await transporter.sendMail(mailOptions);
    
    req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions');
    res.redirect('/login');
});

// Render reset password page
module.exports.renderResetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    
    // Find user by token
    const user = await User.findByResetToken(token);
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/forgot-password');
    }
    
    res.render('users/reset-password', { token });
});

// Process reset password
module.exports.resetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    
    // Find user by token
    const user = await User.findByResetToken(token);
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/forgot-password');
    }
    
    // Change password
    await User.changePassword(user.user_id, password);
    
    // Clear reset token
    await User.clearResetToken(user.user_id);
    
    // Send confirmation email
    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USERNAME,
        subject: 'Your password has been changed',
        text: `Hello,\n\n
               This is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    
    await transporter.sendMail(mailOptions);
    
    req.flash('success', 'Success! Your password has been changed');
    res.redirect('/login');
});

// Render user profile
module.exports.renderProfile = catchAsync(async (req, res) => {
    const userId = req.user.user_id;
    let profileData = null;
    
    // Get profile data based on role
    if (req.user.role === 'donor') {
        profileData = await Donor.findByUserId(userId);
    } else if (req.user.role === 'hospital') {
        profileData = await Hospital.findByUserId(userId);
    } else if (req.user.role === 'staff' || req.user.role === 'admin') {
        profileData = await Staff.findByUserId(userId);
    }
    
    res.render('users/profile', { user: req.user, profileData });
});

// Update user profile
module.exports.updateProfile = catchAsync(async (req, res) => {
    // Handle profile update based on role
    // Implementation will depend on the specific fields for each profile type
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
});

// Change user password
module.exports.changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;
    
    // Verify current password
    const user = await User.findById(userId);
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
        req.flash('error', 'Current password is incorrect');
        return res.redirect('/profile');
    }
    
    // Change password
    await User.changePassword(userId, newPassword);
    
    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
});

// Admin: List all users
module.exports.listUsers = catchAsync(async (req, res) => {
    const users = await User.findAll();
    res.render('admin/users', { users });
});

// Admin: Toggle user active status
module.exports.toggleUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const newStatus = await User.toggleActiveStatus(id);
    
    req.flash('success', `User is now ${newStatus ? 'active' : 'inactive'}`);
    res.redirect('/admin/users');
});

// Admin: Delete user
module.exports.deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    await User.deleteUser(id);
    
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
}); 