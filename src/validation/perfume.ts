import Joi from "joi";

const writeReviewValidation = {
    body: Joi.object({
        perfumeId: Joi.string().required().messages({
            "string.base": "Perfume ID must be a string",
            "any.required": "Perfume ID is required",
        }),
        rating: Joi.number().required().messages({
            "number.base": "Rating must be a number",
            "any.required": "Rating is required",
        }),
        review: Joi.string().required().messages({
            "string.base": "Review must be a string",
            "any.required": "Review is required",
        }),
    }),
};
const getPerfumeReviewsValidation = {
    query: Joi.object({
        perfumeId: Joi.string().required().messages({
            "string.base": "Perfume ID must be a string",
            "any.required": "Perfume ID is required",
        }),
        page: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Page must be a string",
            "string.pattern.base": "Page must be a number",
        }),
        limit: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Limit must be a string",
            "string.pattern.base": "Limit must be a number",
        }),
    }),
};
const idValidation = {
    query: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "ID must be a string",
            "string.pattern.base": "Invalid ID format",
            "any.required": "ID is required",
        }),
    }),
};
const similarValidation = {
    query: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "ID must be a string",
            "string.pattern.base": "Invalid ID format",
            "any.required": "ID is required",
        }),
        type: Joi.string().valid("perfumer", "note").required().messages({
            "string.base": "Type must be a string",
            "any.required": "Type is required",
            "any.only": "Invalid type",
        }),
        page: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Page must be a string",
            "string.pattern.base": "Page must be a number",
        }),
        limit: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Limit must be a string",
            "string.pattern.base": "Limit must be a number",
        }),
    }),
};
const getPerfumeValidation = {
    query: Joi.object({
        perfumeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
            "string.base": "ID must be a string",
            "string.pattern.base": "Invalid ID format",
        }),
        name: Joi.string().optional().messages({
            "string.base": "Name must be a string",
        }),
        brand: Joi.string().optional().messages({
            "string.base": "Brand must be a string",
        }),
        isSearch: Joi.string().valid("true", "false").optional().messages({
            "boolean.base": "Is search must be a boolean",
        }),
    }),
};
const searchValidation = {
    query: Joi.object({
        search: Joi.string().required().messages({
            "string.base": "Search must be a string",
            "any.required": "Search is required",
        }),
        page: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Page must be a string",
            "string.pattern.base": "Page must be a number",
        }),
        limit: Joi.string().pattern(/^[0-9]+$/).optional().messages({
            "string.base": "Limit must be a string",
            "string.pattern.base": "Limit must be a number",
        }),
    }),
};

export default { writeReviewValidation, getPerfumeReviewsValidation, idValidation, similarValidation, getPerfumeValidation, searchValidation,  };
