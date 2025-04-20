// Importing Joi for data validation
const BaseJoi = require('joi');
const sanitizeHTML = require('sanitize-html');


const extension = (joi)=>({
    type:'string',
    base:joi.string(),
    messages:{
        'string.escapeHTML':'{{#label}} must not include HTML!'
    },
    rules:{
        escapeHTML:{
            validate(value,helpers){
                const clean = sanitizeHTML(value,{
                    allowedTags:[],
                    allowedAttributes:{},
                });
                if(clean!==value) return helpers.error('string.escapeHTML',{value})
                    return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);

// Exporting campground schema for validation
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
            title: Joi.string().required().escapeHTML(),  // Title of the campground
            price: Joi.number().required(),  // Price of the campground
            location: Joi.string().required().escapeHTML(),  // Location of the campground
            description: Joi.string().required().escapeHTML(),  // Description of the campground
        }).required(),  // Ensure campground object is present
        deleteImages:Joi.array(),
        //image:Joi.any()
});

module.exports.reviewSchema = Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        body:Joi.string().required().escapeHTML()
    }).required()
});
