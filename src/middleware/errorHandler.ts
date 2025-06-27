import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types/type';
import { ERROR } from '../utils/response';




const errorHandler = (error: CustomError, req: Request, res: Response, next: NextFunction): void => {
    console.error("Error:", error);

    let statusCode = 500;
    let message = "An error occurred";

    const errorTypes: Record<string, { statusCode: number; message: string }> = {
        CastError: { statusCode: 404, message: error.message || 'Resource not found' },
        ValidationError: { statusCode: 400, message: error.message || 'Validation failed' },
        UnauthorizedError: { statusCode: 401, message: error.message || 'Unauthorized' },
        SyntaxError: { statusCode: 400, message: error.message || 'Bad request' },
        JsonWebTokenError: { statusCode: 401, message: error.message || 'Invalid token' },
        TokenExpiredError: { statusCode: 401, message: error.message || 'Token expired' },
        MongoError: { statusCode: 500, message: error.message || 'Database error' },
        TypeError: { statusCode: 400, message: error.message || 'Type error occurred' },
        ReferenceError: { statusCode: 400, message: error.message || 'Reference error occurred' },
        RangeError: { statusCode: 400, message: error.message || 'Range error occurred' },
        URIError: { statusCode: 400, message: error.message || 'Malformed URI' },
        NotFoundError: { statusCode: 404, message: error.message || 'Not found' },
        ForbiddenError: { statusCode: 403, message: error.message || 'Access forbidden' },
        ConflictError: { statusCode: 409, message: error.message || 'Conflict occurred' },
        TooManyRequestsError: { statusCode: 429, message: error.message || 'Too many requests' },
        InternalServerError: { statusCode: 500, message: error.message || 'Internal server error' },
        ServiceUnavailableError: { statusCode: 503, message: error.message || 'Service unavailable' },
        RequestTimeoutError: { statusCode: 408, message: error.message || 'Request timeout' },
        BadRequestError: { statusCode: 400, message: error.message || 'Bad request' },
        NotImplementedError: { statusCode: 501, message: error.message || 'Feature not implemented' },
        GatewayTimeoutError: { statusCode: 504, message: error.message || 'Gateway timeout' },
        DeprecationError: { statusCode: 410, message: error.message || 'Resource deprecated' },
        InvalidInputError: { statusCode: 422, message: error.message || 'Invalid input' },
        PaymentRequiredError: { statusCode: 402, message: error.message || 'Payment required' },
    };
    if (error.name && errorTypes[error.name]) {
        statusCode = errorTypes[error.name].statusCode;
        message = errorTypes[error.name].message;
    }
    else if (error.message) {
        if (error.message.toLowerCase().includes('jwt expired')) {
            statusCode = 401;
            message = 'JWT expired';
        } else if (error.message.toLowerCase().includes('jwt malformed')) {
            statusCode = 401;
            message = 'JWT malformed';
        }
    }
    else if (typeof error === 'string') {
        statusCode = 400;
        message = error;
    }

    ERROR(res, statusCode, message, { stack: error.stack });
};


export default errorHandler;

