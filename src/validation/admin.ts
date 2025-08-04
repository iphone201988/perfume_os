import Joi from "joi";

const loginValidation = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "any.required": "Email is required",
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
const createQuestionValidation = {
    body: Joi.object({
        type: Joi.string().required().valid("trivia", "scent", "guess").messages({
            "string.base": "Type must be a string",
            "any.required": "Type is required",
            "any.only": "Invalid type",
        }),
        questionText: Joi.string().required().messages({
            "string.base": "Question text must be a string",
            "any.required": "Question text is required",
        }),
        options: Joi.array().items(Joi.string()).required().messages({
            "array.base": "Options must be an array",
            "array.min": "At least one option is required",
            "any.required": "Options are required",
        }),
        correctAnswer: Joi.string().required().messages({
            "string.base": "Correct answer must be a string",
            "any.required": "Correct answer is required",
        }),
        explanation: Joi.string().optional(),
    }),
};
const updateQuestionValidation = {
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "Question ID must be a string",
            "string.pattern.base": "Invalid question ID format",
            "any.required": "Question ID is required",
        }),
    }),
    body: Joi.object({
        questionText: Joi.string().optional().messages({
            "string.base": "Question text must be a string",
        }),
        options: Joi.array().items(Joi.string()).optional().messages({
            "array.base": "Options must be an array",
        }),
        correctAnswer: Joi.string().optional().messages({
            "string.base": "Correct answer must be a string",
        }),
        explanation: Joi.string().optional(),
    }),
};
const deleteQuestionValidation = {
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.base": "Question ID must be a string",
            "string.pattern.base": "Invalid question ID format",
            "any.required": "Question ID is required",
        }),
    }),
}
export default {loginValidation, createQuestionValidation, updateQuestionValidation, deleteQuestionValidation };
