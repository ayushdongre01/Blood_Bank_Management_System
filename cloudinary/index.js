const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// Storage for donor profile images
const donorStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloodbank/donors',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

// Storage for staff profile images
const staffStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloodbank/staff',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

// Storage for campaign banners
const campaignStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloodbank/campaigns',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

// Storage for hospital logos
const hospitalStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bloodbank/hospitals',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

// Multer upload configurations
const donorUpload = multer({ storage: donorStorage });
const staffUpload = multer({ storage: staffStorage });
const campaignUpload = multer({ storage: campaignStorage });
const hospitalUpload = multer({ storage: hospitalStorage });

module.exports = {
    cloudinary,
    donorUpload,
    staffUpload,
    campaignUpload,
    hospitalUpload
};