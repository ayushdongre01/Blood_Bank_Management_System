// Date formatting helper
module.exports.formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Time formatting helper
module.exports.formatTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Date and time formatting helper
module.exports.formatDateTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Calculate age from date of birth
module.exports.calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    return age;
};

// Convert ml to units (1 unit = 450ml)
module.exports.mlToUnits = (ml) => {
    if (!ml) return 0;
    return Math.round((ml / 450) * 100) / 100;
};

// Convert units to ml (1 unit = 450ml)
module.exports.unitsToMl = (units) => {
    if (!units) return 0;
    return units * 450;
};

// Check if blood types are compatible for transfusion
module.exports.areBloodTypesCompatible = (donorType, recipientType) => {
    const compatibility = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    };
    
    return compatibility[donorType] && compatibility[donorType].includes(recipientType);
};

// Get compatible donor blood types for a recipient
module.exports.getCompatibleDonorTypes = (recipientType) => {
    const compatibility = {
        'O-': ['O-'],
        'O+': ['O-', 'O+'],
        'A-': ['O-', 'A-'],
        'A+': ['O-', 'O+', 'A-', 'A+'],
        'B-': ['O-', 'B-'],
        'B+': ['O-', 'O+', 'B-', 'B+'],
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };
    
    return compatibility[recipientType] || [];
};

// Generate random ID
module.exports.generateRandomId = (prefix = '', length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
};

// Format phone number
module.exports.formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    return phoneNumber;
};

// Calculate days until expiration
module.exports.daysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return 0;
    
    const expiration = new Date(expirationDate);
    const today = new Date();
    
    // Set hours to 0 to compare only dates
    expiration.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

// Get urgency level color
module.exports.getUrgencyColor = (urgencyLevel) => {
    const colors = {
        'normal': 'info',
        'urgent': 'warning',
        'critical': 'danger'
    };
    
    return colors[urgencyLevel] || 'info';
};

// Get status color
module.exports.getStatusColor = (status) => {
    const colors = {
        'pending': 'info',
        'approved': 'primary',
        'fulfilled': 'success',
        'completed': 'success',
        'rejected': 'danger',
        'processing': 'warning',
        'cancelled': 'secondary',
        'expired': 'secondary'
    };
    
    return colors[status] || 'info';
}; 