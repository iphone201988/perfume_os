import Joi, { allow } from "joi";

const socialLoginValidation = {
  body: Joi.object({
    email: Joi.string().email().optional().messages({
      "string.base": "Email must be a string",
      "string.email": "Invalid email format",
    }),
    fullname: Joi.string().optional().messages({
      "string.base": "Fullname must be a string",
    }),
    socialId: Joi.string().required().messages({
      "string.base": "Social ID must be a string",
      "any.required": "Social ID is required",
    }),
    provider: Joi.string().required().valid("google", "facebook", "apple", "tiktok").messages({
      "string.base": "Provider must be a string",
      "any.required": "Provider is required",
      "any.only": "Invalid provider",
    }),
    deviceType: Joi.number().optional().messages({
      "number.base": "Device type must be a number",
    }),
    deviceToken: Joi.string().optional().messages({
      "string.base": "Device token must be a string",
    }),
  }),
};

const registerValidation = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.base": "Email must be a string",
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).regex(/[A-Z]/).regex(/[0-9]/).regex(/[@$!%*?&]/).required().messages({
      "string.base": "Password must be a string",
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base": "Password must contain at least one uppercase letter, one number, and one special character",
    }),
    username: Joi.string().regex(/^[A-Za-z][A-Za-z0-9@$!%*?&]*$/).required().messages({
      "string.base": "Username must be a string",
      "any.required": "Username is required",
      "string.pattern.base": "Username cannot contain spaces, must not start with a number, and can only contain letters, numbers, and special characters (except at the start)",
    }),
    fullname: Joi.string().required().messages({
      "string.base": "Fullname must be a string",
      "any.required": "Fullname is required",
    }),
    deviceType: Joi.number().optional().messages({
      "number.base": "Device type must be a number",
    }),
    deviceToken: Joi.string().optional().messages({
      "string.base": "Device token must be a string",
    }),
  }),
};

const loginValidation = {
  body: Joi.object({
    username: Joi.string().required().messages({
      "string.base": "Username must be a string",
      "any.required": "Username is required",
    }),
    password: Joi.string().required().messages({
      "string.base": "Password must be a string",
      "any.required": "Password is required",
    }),
    deviceType: Joi.number().optional().messages({
      "number.base": "Device type must be a number",
    }),
    deviceToken: Joi.string().optional().messages({
      "string.base": "Device token must be a string",
    }),
  }),
};

const updateDataValidation = {
  body: Joi.object({
    step: Joi.number().optional().messages({
      "number.base": "Step must be a number",
    }),
    theme: Joi.string().valid("light", "dark").optional().messages({
      "string.base": "Theme must be a string",
      "any.only": "Invalid theme",

    }),
    tutorialProgess: Joi.number().optional().messages({
      "number.base": "Tutorial progress must be a number",
    }),
    oldPassword: Joi.string().optional().messages({
      "string.base": "Old password must be a string",
    }),
    newPassword: Joi.string().min(6).regex(/[A-Z]/).regex(/[0-9]/).regex(/[@$!%*?&]/).optional().messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base": "Password must contain at least one uppercase letter, one number, and one special character",
    }),
    timezone: Joi.string().optional().messages({
      "string.base": "Timezone must be a string",
    }),
    gender: Joi.string().optional().messages({
      "string.base": "Gender must be a string",
      "string.empty": "Gender cannot be empty",
    }),
    language: Joi.string().optional().messages({
      "string.base": "Language must be a string",
    }),
    dob: Joi.date().optional().messages({
      "date.base": "DOB must be a valid date",
      "string.empty": "DOB cannot be empty",
    }),
    perfumeStrength: Joi.number().optional().messages({
      "number.base": "Perfume strength must be a number",
      "string.empty": "Perfume strength cannot be empty",
    }),
    perfumeBudget: Joi.string().optional().messages({
      "string.base": "Perfume budget must be a string",
      "string.empty": "Perfume budget cannot be empty",
    }),
    enjoySmell: Joi.array().items(Joi.string()).optional().messages({
      "array.base": "Enjoy smell must be an array of strings",
    }),
    reasonForWearPerfume: Joi.string().optional().messages({
      "string.base": "Reason for wearing perfume must be a string",
      "string.empty": "Reason for wearing perfume cannot be empty",
    }),
    referralSource: Joi.string().optional().messages({
      "string.base": "Referral source must be a string",
      "string.empty": "Referral source cannot be empty",
    }),
    referredBy: Joi.string().optional().allow(null, "").messages({
      "string.base": "Referred by must be a string",
    }),
  }).with("oldPassword", "newPassword")
    .with("newPassword", "oldPassword"),
};

const profileUpateValidation = {
  body: Joi.object({
    username: Joi.string().regex(/^[A-Za-z][A-Za-z0-9]*$/).optional().messages({
      "string.base": "Username must be a string",
      "string.pattern.base": "Username cannot contain spaces, must not start with a number, and can only contain letters and numbers",
    }),
    fullname: Joi.string().optional().messages({
      "string.base": "Fullname must be a string",
    }),
    timezone: Joi.string().optional().messages({
      "string.base": "Timezone must be a string",
    }),
  }),
};

const forgetValidation = {
  body: Joi.object({
    email: Joi.string().email().required().lowercase().messages({
      "string.base": "Email must be a string",
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    type: Joi.number().integer().required().valid(1, 2, 3, 4, 5, 6).messages({
      "number.base": "Type must be a number",
      "number.integer": "Type must be an integer",
      "any.required": "Type is required",
      "any.only": "Type must be one of 1, 2, 3, 4, 5, or 6",
    }),
  }),
};

const verifyOtpValidation = {
  body: Joi.object({
    email: Joi.string().email().required().lowercase().messages({
      "string.base": "Email must be a string",
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    otp: Joi.string().required().pattern(/^\d{4}$/).messages({
      "string.base": "OTP must be a string",
      "string.pattern.base": "OTP must be a 4-digit number",
      "any.required": "OTP is required",
    }),
  }),
};

const resetValidation = {
  body: Joi.object({
   password: Joi.string().min(6).regex(/[A-Z]/).regex(/[0-9]/).regex(/[@$!%*?&]/).required().messages({
      "string.base": "Password must be a string",
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base": "Password must contain at least one uppercase letter, one number, and one special character",
    }),
  }),
};
const deleteValidation = {
  query: Joi.object({
    password: Joi.string().required().messages({
      "string.base": "Password must be a string",
      "any.required": "Password is required",
    }),
  }),
};

const followValidation = {
  params: Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.base": "User ID must be a string",
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
  }),
};

const collectionValidation = {
  params: Joi.object({
    perfumeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.base": "Perfume ID must be a string",
      "string.pattern.base": "Invalid perfume ID format",
      "any.required": "Perfume ID is required",
    }),
  }),
};

const userDataValidation = {
  query: Joi.object({
    page: Joi.string().pattern(/^[0-9]+$/).optional().messages({
      "string.base": "Page must be a string",
      "string.pattern.base": "Page must be a number",
    }),
    limit: Joi.string().pattern(/^[0-9]+$/).optional().messages({
      "string.base": "Limit must be a string",
      "string.pattern.base": "Limit must be a number",
    }),
    type: Joi.string().valid("collection", "review", "badge", "wishlist").required().messages({
      "string.base": "Type must be a string",
      "any.required": "Type is required",
      "any.only": "Invalid type",
    })
  }),
};

export default {
  socialLoginValidation,
  registerValidation,
  loginValidation,
  updateDataValidation,
  profileUpateValidation,
  forgetValidation,
  verifyOtpValidation,
  resetValidation,
  followValidation,
  collectionValidation,
  deleteValidation,
  userDataValidation
};
