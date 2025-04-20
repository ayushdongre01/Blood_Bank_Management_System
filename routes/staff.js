const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { isLoggedIn, isAdmin } = require('../middleware');
const multer = require('multer');
const path = require('path');

// Configure storage for profile images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'staff-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Staff routes
router.get('/', isLoggedIn, isAdmin, staffController.getAllStaff);
router.get('/add', isLoggedIn, isAdmin, staffController.renderAddStaffForm);
router.post('/', isLoggedIn, isAdmin, upload.single('profile_image'), staffController.createStaff);
router.delete('/:id', isLoggedIn, isAdmin, staffController.deleteStaff);

module.exports = router; 