const express = require('express');
const router = express.Router();
const bloodInventoryController = require('../controllers/bloodInventoryController');
const { isLoggedIn, isAdminOrStaff, isHospital } = require('../middleware');

// Routes accessible by admin and staff
router.get('/', isLoggedIn, bloodInventoryController.getInventorySummary);
router.get('/details', isLoggedIn, isAdminOrStaff, bloodInventoryController.getInventoryDetails);
router.get('/type/:bloodType', isLoggedIn, isAdminOrStaff, bloodInventoryController.getInventoryByBloodType);
router.get('/status/:status', isLoggedIn, isAdminOrStaff, bloodInventoryController.getInventoryByStatus);
router.get('/expiring', isLoggedIn, isAdminOrStaff, bloodInventoryController.getExpiringInventory);
router.get('/expiring/:days', isLoggedIn, isAdminOrStaff, bloodInventoryController.getExpiringByPeriod);
router.get('/low-stock', isLoggedIn, isAdminOrStaff, bloodInventoryController.getLowStockInventory);

// Routes for inventory management
router.post('/', isLoggedIn, isAdminOrStaff, bloodInventoryController.addInventory);
router.get('/:id', isLoggedIn, isAdminOrStaff, bloodInventoryController.getInventoryById);
router.put('/:id', isLoggedIn, isAdminOrStaff, bloodInventoryController.updateInventory);
router.put('/:id/status', isLoggedIn, isAdminOrStaff, bloodInventoryController.updateInventoryStatus);
router.delete('/:id', isLoggedIn, isAdminOrStaff, bloodInventoryController.deleteInventory);

// Routes for hospitals to check availability
router.get('/availability', isLoggedIn, isHospital, bloodInventoryController.checkBloodAvailability);
router.post('/availability/check', isLoggedIn, isHospital, bloodInventoryController.checkSpecificBloodAvailability);

// Export routes
module.exports = router; 