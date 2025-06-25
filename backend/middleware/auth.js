const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Erişim token\'ı gerekli'
            });
        }

        // Extract token from "Bearer TOKEN" format
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token formatı'
            });
        }

        // JWT Secret güvenlik kontrolü
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret || jwtSecret === 'default_secret') {
            return res.status(500).json({
                success: false,
                message: 'JWT yapılandırması güvenli değil'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, jwtSecret);
        
        // Check if user has admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Yetkisiz erişim - Admin yetkisi gerekli'
            });
        }

        // Add user info to request object
        req.admin = {
            email: decoded.email,
            role: decoded.role,
            loginTime: decoded.loginTime
        };

        next();

    } catch (error) {
        logger.error('Authentication hatası:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication kontrolünde hata oluştu'
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            
            if (token) {
                const jwtSecret = process.env.JWT_SECRET;
                if (!jwtSecret || jwtSecret === 'default_secret') {
                    return res.status(500).json({
                        success: false,
                        message: 'JWT yapılandırması güvenli değil'
                    });
                }
                
                const decoded = jwt.verify(token, jwtSecret);
                req.admin = {
                    email: decoded.email,
                    role: decoded.role,
                    loginTime: decoded.loginTime
                };
            }
        }

        next();

    } catch (error) {
        // Optional auth - continue even if token is invalid
        logger.warn('Optional auth hatası:', error.message);
        next();
    }
};

module.exports = {
    authenticateAdmin,
    optionalAuth
}; 