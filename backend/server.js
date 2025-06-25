const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Route imports
const applicationRoutes = require('./routes/applications');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // iframe embedding için gerekli ayarlar
    frameguard: false, // X-Frame-Options'ı devre dışı bırak çünkü iframe'de kullanılacak
    contentSecurityPolicy: false, // CSP'yi devre dışı bırak veya özelleştir
}));

// Production için extra security headers
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // iframe embedding için güvenlik başlıkları
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // File upload security
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        
        next();
    });
}

// Compression middleware
app.use(compression());

// CORS configuration - Production Ready
const corsOptions = {
    origin: function (origin, callback) {
        // Development için localhost'lara izin ver
        const localDomains = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:8081',
            'http://127.0.0.1:8081'
        ];

        // Production domainleri environment'tan al
        const productionDomains = process.env.PRODUCTION_FRONTEND_DOMAINS 
            ? process.env.PRODUCTION_FRONTEND_DOMAINS.split(',').map(d => d.trim())
            : [];

        // Tek bir frontend URL'si de olabilir
        if (process.env.FRONTEND_URL) {
            productionDomains.push(process.env.FRONTEND_URL);
        }

        // Tüm allowed domains
        const allowedOrigins = [...localDomains, ...productionDomains];

        // iframe için origin yok ise (some browsers don't send origin for iframe)
        if (!origin) {
            return callback(null, true);
        }

        // Origin kontrolü
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log(`CORS: Blocked origin: ${origin}`);
            console.log(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // request limiti
    message: {
        error: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Sidrex Detox Form API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/admin', adminRoutes);

// API documentation endpoint
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'Sidrex Detox Form API v1',
        version: '1.0.0',
        endpoints: {
            applications: {
                'POST /api/v1/applications': 'Yeni başvuru oluştur',
                'GET /api/v1/applications': 'Tüm başvuruları listele (Admin)',
                'GET /api/v1/applications/:id': 'Başvuru detayını getir (Admin)',
                'PUT /api/v1/applications/:id': 'Başvuru güncelle (Admin)',
                'DELETE /api/v1/applications/:id': 'Başvuru sil (Admin)'
            },
            files: {
                'POST /api/v1/files/upload': 'Dosya yükle',
                'GET /api/v1/files/:filename': 'Dosya indir'
            },
            admin: {
                'POST /api/v1/admin/login': 'Admin girişi',
                'GET /api/v1/admin/dashboard': 'Admin dashboard verileri',
                'GET /api/v1/admin/statistics': 'İstatistikler'
            }
        },
        documentation: 'Daha detaylı API dokümantasyonu için README.md dosyasını inceleyiniz.'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint bulunamadı',
        message: `${req.method} ${req.originalUrl} endpoint\'i mevcut değil.`,
        availableEndpoints: '/api/v1'
    });
});

// Error handling middleware
app.use(errorHandler);

// Create necessary directories
async function createDirectories() {
    const directories = ['./data', './uploads', './logs'];
    
    for (const dir of directories) {
        try {
            await fs.access(dir);
        } catch (error) {
            await fs.mkdir(dir, { recursive: true });
            logger.info(`Created directory: ${dir}`);
        }
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        await createDirectories();
        
        app.listen(PORT, () => {
            logger.info(`🚀 Sidrex Detox Form API başlatıldı!`);
            logger.info(`📍 Port: ${PORT}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
            logger.info(`❤️ Health Check: http://localhost:${PORT}/health`);
            
            if (process.env.NODE_ENV === 'development') {
                logger.info(`🔧 Dev Mode - Hot reloading enabled`);
            }
        });
    } catch (error) {
        logger.error('Server başlatılamadı:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app; 