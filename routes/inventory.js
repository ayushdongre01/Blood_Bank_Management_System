const express = require('express');
const router = express.Router();
const bloodInventoryController = require('../controllers/bloodInventoryController');
const { isLoggedIn, isAdminOrStaff } = require('../middleware');

// Blood inventory routes
router.get('/', bloodInventoryController.getAllInventory);
router.get('/edit/:id', isLoggedIn, isAdminOrStaff, bloodInventoryController.renderUpdateForm);

// Use POST for the direct update from the quick form
router.post('/update', isLoggedIn, isAdminOrStaff, bloodInventoryController.updateInventoryByType);
router.post('/update/:id', isLoggedIn, isAdminOrStaff, bloodInventoryController.updateInventory);

// For adding new blood
router.post('/add', isLoggedIn, isAdminOrStaff, bloodInventoryController.addBloodQuantity);

// Calculate and update inventory from donations
router.post('/calculate-from-donations', isLoggedIn, isAdminOrStaff, bloodInventoryController.calculateFromDonations);

module.exports = router; 