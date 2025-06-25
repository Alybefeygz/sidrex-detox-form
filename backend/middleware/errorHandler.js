const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log the full error for debugging
    logger.error(`Error in ${req.method} ${req.originalUrl}:`, {
        message: error.message,
        stack: error.stack,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Geçersiz ID formatı';
        error = { message, statusCode: 400 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Bu veri zaten mevcut';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Geçersiz token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token süresi dolmuş';
        error = { message, statusCode: 401 };
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'Dosya boyutu çok büyük';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        const message = 'Çok fazla dosya yüklendi';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Beklenmeyen dosya alanı';
        error = { message, statusCode: 400 };
    }

    // File system errors
    if (err.code === 'ENOENT') {
        const message = 'Dosya bulunamadı';
        error = { message, statusCode: 404 };
    }

    if (err.code === 'EACCES') {
        const message = 'Dosya erişim yetkisi yok';
        error = { message, statusCode: 403 };
    }

    // Network errors
    if (err.code === 'ECONNREFUSED') {
        const message = 'Bağlantı reddedildi';
        error = { message, statusCode: 503 };
    }

    if (err.code === 'ETIMEDOUT') {
        const message = 'Bağlantı zaman aşımına uğradı';
        error = { message, statusCode: 408 };
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Enhanced error response
    const errorResponse = {
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            error: {
                statusCode: statusCode,
                stack: err.stack,
                details: error
            }
        }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 