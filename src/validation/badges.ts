import Joi from "joi";

const createBadgeValidation = {
    body: Joi.object({
        name: Joi.string().required().messages({
            "string.base": "Name must be a string",
            "any.required": "Name is required",
        }),
    }),
};
const updateBadgeValidation = {
    params: Joi.object({
        badgeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "Badge ID must be a string",
            "string.pattern.base": "Invalid badge ID format",
            "any.required": "Badge ID is required",
        }),
    }),
    body: Joi.object({
        name: Joi.string().optional().messages({
            "string.base": "Name must be a string",
        }),
    }),
};

export default { createBadgeValidation , updateBadgeValidation };