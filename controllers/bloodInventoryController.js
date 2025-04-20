const BloodInventory = require('../models/bloodInventory');
const catchAsync = require('../utils/catchAsync');

// Get inventory summary
module.exports.getInventorySummary = catchAsync(async (req, res) => {
    const stats = await BloodInventory.getStats();
    res.render('inventory/summary', { stats, title: 'Blood Inventory Summary' });
});

// Get detailed inventory
module.exports.getInventoryDetails = catchAsync(async (req, res) => {
    const inventory = await BloodInventory.getAll();
    res.render('inventory/details', { inventory, title: 'Blood Inventory Details' });
});

// Get inventory by blood type
module.exports.getInventoryByBloodType = catchAsync(async (req, res) => {
    const { bloodType } = req.params;
    const inventory = await BloodInventory.findByBloodType(bloodType);
    res.render('inventory/by-type', { inventory, bloodType, title: `${bloodType} Blood Inventory` });
});

// Get inventory by status
module.exports.getInventoryByStatus = catchAsync(async (req, res) => {
    const { status } = req.params;
    const inventory = await BloodInventory.findByStatus(status);
    res.render('inventory/by-status', { inventory, status, title: `${status} Blood Inventory` });
});

// Get expiring inventory
module.exports.getExpiringInventory = catchAsync(async (req, res) => {
    const days = req.query.days || 7; // Default to 7 days
    const inventory = await BloodInventory.findExpiring(days);
    res.render('inventory/expiring', { inventory, days, title: 'Expiring Blood Inventory' });
});

// Get inventory expiring within specified days
module.exports.getExpiringByPeriod = catchAsync(async (req, res) => {
    const days = parseInt(req.params.days) || 7; 
    const inventory = await BloodInventory.findExpiring(days);
    
    // Add days until expiry calculation for each item
    inventory.forEach(item => {
        const expirationDate = new Date(item.expiration_date);
        const today = new Date();
        const diffTime = expirationDate - today;
        item.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
    
    res.render('inventory/expiring-by-period', { 
        inventory, 
        days, 
        title: `Blood Inventory Expiring Within ${days} Days` 
    });
});

// Get low stock inventory
module.exports.getLowStockInventory = catchAsync(async (req, res) => {
    const inventory = await BloodInventory.findLowStock();
    res.render('inventory/low-stock', { inventory, title: 'Low Stock Blood Inventory' });
});

// Add inventory
module.exports.addInventory = catchAsync(async (req, res) => {
    const inventoryData = req.body.inventory;
    await BloodInventory.create(inventoryData);
    req.flash('success', 'Blood inventory added successfully');
    res.redirect('/blood-inventory/details');
});

// Get inventory by ID
module.exports.getInventoryById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const inventoryItem = await BloodInventory.findById(id);
    
    if (!inventoryItem) {
        req.flash('error', 'Inventory item not found');
        return res.redirect('/blood-inventory/details');
    }
    
    res.render('inventory/show', { inventoryItem, title: 'Inventory Item Details' });
});

// Update inventory
module.exports.updateInventory = catchAsync(async (req, res) => {
    console.log('Update Inventory Request:', req.params, req.body);
    const { id } = req.params;
    const { quantity_available, current_status } = req.body;
    
    // If the id is a blood type, get the inventory_id first
    if (isNaN(id) && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(id)) {
        const inventory = await BloodInventory.getByType(id);
        if (inventory && inventory.inventory_id) {
            await BloodInventory.update(inventory.inventory_id, {
                quantity_available: parseFloat(quantity_available),
                current_status
            });
        } else {
            // Create new inventory if it doesn't exist
            await BloodInventory.updateQuantity(id, parseFloat(quantity_available));
        }
    } else {
        // Directly update by ID
        await BloodInventory.update(id, {
            quantity_available: parseFloat(quantity_available),
            current_status
        });
    }
    
    req.flash('success', 'Blood inventory updated successfully');
    res.redirect('/inventory');
});

// Update inventory status
module.exports.updateInventoryStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    await BloodInventory.updateStatus(id, status);
    req.flash('success', 'Inventory status updated successfully');
    res.redirect('/blood-inventory/details');
});

// Delete inventory
module.exports.deleteInventory = catchAsync(async (req, res) => {
    const { id } = req.params;
    await BloodInventory.delete(id);
    req.flash('success', 'Inventory deleted successfully');
    res.redirect('/blood-inventory/details');
});

// Check blood availability (for hospitals)
module.exports.checkBloodAvailability = catchAsync(async (req, res) => {
    const stats = await BloodInventory.getStats();
    res.render('inventory/availability', { stats, title: 'Blood Availability' });
});

// Check specific blood availability (for hospitals)
module.exports.checkSpecificBloodAvailability = catchAsync(async (req, res) => {
    const { bloodType, component, quantity } = req.body;
    const availability = await BloodInventory.checkAvailability(bloodType, component, quantity);
    
    res.render('inventory/availability-result', { 
        bloodType, 
        component, 
        quantity,
        availability,
        title: 'Blood Availability Check'
    });
});

module.exports.getAllInventory = catchAsync(async (req, res) => {
    try {
        // Get all blood inventory items
        const inventory = await BloodInventory.getAll();
        
        // Get all possible blood types
        const allBloodTypes = await BloodInventory.getAllBloodTypes();
        
        // Create an object to store inventory by blood type
        const inventoryByType = {};
        
        // Initialize all blood types with default values
        allBloodTypes.forEach(type => {
            inventoryByType[type] = {
                blood_type: type,
                quantity_available: 0,
                components: null,
                expiration_date: null,
                current_status: 'unavailable',
                inventory_id: null
            };
        });
        
        // Populate with actual inventory data
        inventory.forEach(item => {
            inventoryByType[item.blood_type] = item;
        });
        
        // Convert to array for easier rendering
        const inventoryData = Object.values(inventoryByType);
        
        res.render('inventory/index', { 
            title: 'Blood Inventory',
            inventory: inventoryData,
            currentUser: req.user
        });
    } catch (error) {
        req.flash('error', 'Failed to retrieve blood inventory');
        res.redirect('/');
    }
});

module.exports.renderUpdateForm = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // First try to get inventory by ID if it's a number
    let inventory = null;
    if (!isNaN(id)) {
        inventory = await BloodInventory.getByType(id);
    } else {
        // Otherwise, assume it's a blood type
        inventory = await BloodInventory.getByType(id);
    }
    
    if (!inventory) {
        // If no inventory exists, create a default object
        inventory = {
            blood_type: id,
            quantity_available: 0,
            components: null,
            expiration_date: null,
            current_status: 'unavailable',
            inventory_id: null
        };
    }
    
    res.render('inventory/edit', {
        inventory,
        title: `Edit ${inventory.blood_type} Inventory`,
        currentUser: req.user
    });
});

module.exports.addBloodQuantity = catchAsync(async (req, res) => {
    const { blood_type, quantity } = req.body;
    
    if (!blood_type || !quantity) {
        req.flash('error', 'Blood type and quantity are required');
        return res.redirect('/inventory');
    }
    
    await BloodInventory.updateQuantity(blood_type, parseFloat(quantity));
    
    req.flash('success', `Successfully added ${quantity} units of ${blood_type} blood`);
    res.redirect('/inventory');
});

// Update inventory by type (for the quick update form)
module.exports.updateInventoryByType = catchAsync(async (req, res) => {
    const { blood_type, quantity_available, current_status } = req.body;
    
    if (!blood_type || !quantity_available) {
        req.flash('error', 'Blood type and quantity are required');
        return res.redirect('/inventory');
    }
    
    // First check if inventory exists for this blood type
    let inventory = await BloodInventory.getByType(blood_type);
    
    if (inventory) {
        // Update existing inventory
        await BloodInventory.update(inventory.inventory_id, {
            quantity_available: parseFloat(quantity_available),
            current_status
        });
    } else {
        // Create new inventory record
        await BloodInventory.updateQuantity(blood_type, parseFloat(quantity_available));
    }
    
    req.flash('success', `${blood_type} blood inventory updated successfully`);
    res.redirect('/inventory');
});

// Calculate and update blood inventory from donations
module.exports.calculateFromDonations = catchAsync(async (req, res) => {
    try {
        const results = await BloodInventory.calculateAndUpdateFromDonations();
        req.flash('success', 'Blood inventory successfully updated from donations');
        
        // Return as JSON if requested
        if (req.headers.accept === 'application/json') {
            return res.json({ success: true, results });
        }
        
        // Otherwise redirect to inventory page
        res.redirect('/inventory');
    } catch (error) {
        console.error('Error updating inventory from donations:', error);
        req.flash('error', 'Failed to update blood inventory: ' + error.message);
        
        if (req.headers.accept === 'application/json') {
            return res.status(500).json({ success: false, error: error.message });
        }
        
        res.redirect('/inventory');
    }
}); 