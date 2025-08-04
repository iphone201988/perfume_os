import Joi from "joi";

const createArticleValidation = {
    body: Joi.object({
        name: Joi.string().required().messages({
            "string.base": "Name must be a string",
            "any.required": "Name is required",
        }),
        content: Joi.string().required().messages({
            "string.base": "Content must be a string",
            "any.required": "Content is required",
        }),
    }),
};
const updateArticleValidation = {
    params: Joi.object({
        articleId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "Article ID must be a string",
            "string.pattern.base": "Invalid article ID format",
            "any.required": "Article ID is required",
        }),
    }),
    body: Joi.object({
        name: Joi.string().optional().messages({
            "string.base": "Name must be a string",
        }),
        content: Joi.string().optional().messages({
            "string.base": "Content must be a string",
        }),
    }),
};

export default { createArticleValidation , updateArticleValidation };