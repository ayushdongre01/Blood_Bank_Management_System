const express = require('express');
const passport = require('passport');
const multer = require('multer');
const router = express.Router();
const userController = require('../controllers/userController');
const { isLoggedIn, isAdmin } = require('../middleware');
const { cloudinary, donorUpload, hospitalUpload } = require('../cloudinary');

// Auth routes
router.get('/register', userController.renderRegister);

// Handle registration with file upload
router.post('/register', (req, res, next) => {
    // Setup a general storage for any file uploads during registration
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    
    // Use single upload middleware with the field name from our form
    upload.single('profile_image')(req, res, async function(err) {
        if (err) {
            console.error('File upload error:', err);
            req.flash('error', 'Error uploading file: ' + err.message);
            return res.redirect('/register');
        }
        
        // Now process the file with Cloudinary based on role
        if (req.file) {
            console.log('File uploaded successfully:', req.file.originalname);
            const role = req.body.role;
            
            // Use the appropriate Cloudinary folder based on role
            let folderPath = 'bloodbank/';
            if (role === 'donor') {
                folderPath += 'donors';
            } else if (role === 'hospital') {
                folderPath += 'hospitals';
            }
            
            // Create a buffer from the file
            const fileBuffer = req.file.buffer;
            
            // Create a promise to handle the Cloudinary upload
            const uploadToCloudinary = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        folder: folderPath,
                        resource_type: 'image'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                
                // Convert buffer to stream and pipe to uploadStream
                const bufferStream = require('stream').Readable.from(fileBuffer);
                bufferStream.pipe(uploadStream);
            });
            
            try {
                // Wait for upload to complete
                const result = await uploadToCloudinary;
                
                // Save the Cloudinary URL to the request object
                req.cloudinaryUrl = result.secure_url;
                next();
            } catch (error) {
                console.error('Cloudinary upload error:', error);
                req.flash('error', 'Error uploading to cloud storage');
                return res.redirect('/register');
            }
        } else {
            // If no file was uploaded, proceed to controller
            next();
        }
    });
}, userController.register);

router.get('/login', userController.renderLogin);
router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), userController.login);
router.get('/logout', userController.logout);

// Password routes
router.get('/forgot-password', userController.renderForgotPassword);
router.post('/forgot-password', userController.forgotPassword);
router.get('/reset-password/:token', userController.renderResetPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Profile routes
router.get('/profile', isLoggedIn, userController.renderProfile);
router.put('/profile', isLoggedIn, userController.updateProfile);
router.put('/profile/password', isLoggedIn, userController.changePassword);

// Admin routes for user management
router.get('/admin/users', isLoggedIn, isAdmin, userController.listUsers);
router.put('/admin/users/:id/status', isLoggedIn, isAdmin, userController.toggleUserStatus);
router.delete('/admin/users/:id', isLoggedIn, isAdmin, userController.deleteUser);

module.exports = router; 