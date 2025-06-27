import Joi from "joi";


const socialLoginValidation = {
    body: Joi.object({
        email: Joi.string().email().optional().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
        }),
        fullname: Joi.string().optional().messages({
            "string.base": "fullname must be a string",
        }),
        socialId: Joi.string().required().messages({
            "string.base": "socialId must be a string",
            "string.required": "socialId is required"
        }),
        provider: Joi.string().required().valid("google", "facebook", "apple", "tiktok").messages({
            "string.base": "provider must be a string",
            "string.required": "provider is required",
            "string.valid": "Invalid provider",

        }),
        deviceType: Joi.number().optional().messages({
            "number.base": "deviceType must be a number",
        }),
        deviceToken: Joi.string().optional().messages({
            "string.base": "deviceToken must be a string",
        })
    })
};

const registerValidation = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.required": "Email is required"
        }),
        password: Joi.string().min(6).required().messages({
            "string.base": "Password must be a string",
            "string.min": "Password must be at least 6 characters long",
            "string.required": "Password is required"
        }),
        username: Joi.string().required().messages({
            "string.base": "username must be a string",
            "string.required": "Username is required"
        }),
        fullname: Joi.string().required().messages({
            "string.base": "fullname must be a string",
            "string.required": "Fullname is required"
        }),
        deviceType: Joi.number().optional().messages({
            "number.base": "deviceType must be a number",
        }),
        deviceToken: Joi.string().optional().messages({
            "string.base": "deviceToken must be a string",
        })
    })
}
const loginValidation = {
    body: Joi.object({
        username: Joi.string().required().messages({
            "string.base": "username must be a string",
            "string.required": "Username is required"
        }),
        password: Joi.string().min(6).required().messages({
            "string.base": "Password must be a string",
            "string.min": "Password must be at least 6 characters long",
            "string.required": "Password is required"
        }),
         deviceType: Joi.number().optional().messages({
            "number.base": "deviceType must be a number",
        }),
        deviceToken: Joi.string().optional().messages({
            "string.base": "deviceToken must be a string",
        })
    })
};
const updateDataValidation = {
    body: Joi.object({
        step: Joi.number().optional().messages({
            "number.base": "step must be a number",
        }),

        oldPassword: Joi.string().min(6).optional().messages({
            "string.base": "Old Password must be a string",
            "string.min": "Password must be at least 6 characters long",
        }),
        newPassword: Joi.string().min(6).optional().messages({
            "string.base": " New Password must be a string",
            "string.min": "Password must be at least 6 characters long",
        }),
        timezone: Joi.string().optional().messages({
            "string.base": "timezone must be a string",
        }),
        gender: Joi.string().optional().messages({
            "string.base": "gender must be a string",
        }),
        language: Joi.string().optional().messages({
            "string.base": "language must be a string",
        }),
        dob: Joi.date().optional().messages({
            "date.base": "dob must be a valid date",
        }),
        perfumeStrength: Joi.number().optional().messages({
            "number.base": "perfumeStrength must be a number",
        }),
        perfumeBudget: Joi.string().optional().messages({
            "string.base": "perfumeBudget must be a string",
        }),
        enjoySmell: Joi.array().items(Joi.string()).optional().messages({
            "array.base": "enjoySmell must be an array of strings",
        }),
        reasonForWearPerfume: Joi.string().optional().messages({
            "string.base": "reasonForWearPerfume must be a string",
        }),
        referralSource: Joi.string().optional().messages({
            "string.base": "referralSource must be a string",
        }),
        referredBy: Joi.string().optional().messages({
            "string.base": "Referred By must be a string",
        }),
    }).with('oldPassword', 'newPassword')
        .with('newPassword', 'oldPassword')
};
const profileUpateValidation = {
    body: Joi.object({
        username: Joi.string().optional().messages({
            "string.base": "username must be a string",
        }),
        fullname: Joi.string().optional().messages({
            "string.base": "fullname must be a string",
        }),
        timezone: Joi.string().optional().messages({
            "string.base": "timezone must be a string",
        }),
       
    })
};
const forgetValidation = {
    body: Joi.object({
        email: Joi.string().email().required().lowercase().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.required": "Email is required"
        }),
        type: Joi.number().integer().required().valid(1,2,3,4)
    })
};
const verifyOtpValidation = {
    body: Joi.object({
        email: Joi.string().email().required().lowercase().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.required": "Email is required"
        }),
        otp: Joi.string().required().pattern(/^\d{4}$/)
    })
};
const resetValidation = {
    body: Joi.object({
         password: Joi.string().min(6).required().messages({
            "string.base": "Password must be a string",
            "string.min": "Password must be at least 6 characters long",
            "string.required": "Password is required"
        }),
    })
};

export default {socialLoginValidation, registerValidation, loginValidation, updateDataValidation, profileUpateValidation, forgetValidation, verifyOtpValidation, resetValidation };