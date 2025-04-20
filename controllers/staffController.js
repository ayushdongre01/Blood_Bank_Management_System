const Staff = require('../models/staff');
const catchAsync = require('../utils/catchAsync');

const staffController = {
    // Display all staff members
    getAllStaff: catchAsync(async (req, res) => {
        const staffList = await Staff.findAll();
        
        res.render('staff/index', {
            title: 'Staff Management',
            staffList
        });
    }),
    
    // Render add staff form
    renderAddStaffForm: catchAsync(async (req, res) => {
        res.render('staff/add', {
            title: 'Add New Staff Member'
        });
    }),
    
    // Create a new staff member
    createStaff: catchAsync(async (req, res) => {
        const {
            first_name,
            last_name,
            email,
            phone,
            position,
            department
        } = req.body;
        
        // Check required fields
        if (!first_name || !last_name || !email || !position) {
            req.flash('error', 'Please fill all required fields');
            return res.redirect('/staff/add');
        }
        
        // Handle profile image if uploaded
        const profile_image = req.file ? `/uploads/${req.file.filename}` : null;
        
        console.log('Creating staff member with data:', {
            first_name,
            last_name,
            email,
            phone,
            position,
            department,
            profile_image
        });
        
        // Create staff member
        await Staff.create({
            first_name,
            last_name,
            email,
            phone,
            position,
            department,
            profile_image
        });
        
        req.flash('success', 'Staff member added successfully');
        res.redirect('/staff');
    }),
    
    // Delete a staff member
    deleteStaff: catchAsync(async (req, res) => {
        const { id } = req.params;
        
        const success = await Staff.delete(id);
        
        if (success) {
            req.flash('success', 'Staff member deleted successfully');
        } else {
            req.flash('error', 'Failed to delete staff member');
        }
        
        res.redirect('/staff');
    })
};

module.exports = staffController; 