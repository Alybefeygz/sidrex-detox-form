const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

const logger = require('../utils/logger');
const googleSheetsService = require('../utils/googleSheetsService');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email ve şifre gerekli'
            });
        }

        // Simple admin check (In production, use database)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@sidrex.com';
        const adminPassword = process.env.ADMIN_PASSWORD;

        // JWT Secret kontrolü
        const jwtSecret = process.env.JWT_SECRET;
        
        if (!adminPassword) {
            return res.status(500).json({
                success: false,
                message: 'Admin şifresi yapılandırılmamış. ADMIN_PASSWORD environment variable\'ını ayarlayın.'
            });
        }

        if (!jwtSecret || jwtSecret === 'default_secret') {
            return res.status(500).json({
                success: false,
                message: 'JWT secret güvenli değil. JWT_SECRET environment variable\'ını güvenli bir değerle ayarlayın.'
            });
        }

        if (email !== adminEmail) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz giriş bilgileri'
            });
        }

        // Compare password (in production, use hashed passwords)
        const isPasswordValid = password === adminPassword;
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz giriş bilgileri'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: adminEmail,
                role: 'admin',
                loginTime: new Date().toISOString()
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Log admin login
        logger.info(`Admin giriş: ${email}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                token: token,
                admin: {
                    email: adminEmail,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        logger.error('Admin giriş hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Giriş yapılırken hata oluştu'
        });
    }
});

// Admin dashboard data
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const dashboardData = await getDashboardStatistics();
        
        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        logger.error('Dashboard veri hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dashboard verileri yüklenirken hata oluştu'
        });
    }
});

// Admin statistics
router.get('/statistics', authenticateAdmin, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        const statistics = await getDetailedStatistics(period);
        
        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        logger.error('İstatistik hatası:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler yüklenirken hata oluştu'
        });
    }
});

// System info
router.get('/system', authenticateAdmin, async (req, res) => {
    try {
        const systemInfo = await getSystemInformation();
        
        res.json({
            success: true,
            data: systemInfo
        });

    } catch (error) {
        logger.error('Sistem bilgi hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sistem bilgileri alınırken hata oluştu'
        });
    }
});

// Google Sheets test connection
router.get('/google-sheets/test', authenticateAdmin, async (req, res) => {
    try {
        const result = await googleSheetsService.testConnection();
        
        res.json({
            success: result.success,
            message: result.success ? 'Google Sheets bağlantısı başarılı' : 'Google Sheets bağlantı hatası',
            data: result
        });

    } catch (error) {
        logger.error('Google Sheets test hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Google Sheets test edilirken hata oluştu',
            error: error.message
        });
    }
});

// Google Sheets statistics
router.get('/google-sheets/statistics', authenticateAdmin, async (req, res) => {
    try {
        const statistics = await googleSheetsService.getStatistics();
        
        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        logger.error('Google Sheets istatistik hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Google Sheets istatistikleri alınırken hata oluştu',
            error: error.message
        });
    }
});

// Google Sheets data export
router.get('/google-sheets/export', authenticateAdmin, async (req, res) => {
    try {
        const { range } = req.query;
        const result = await googleSheetsService.getFormData(range);
        
        res.json({
            success: true,
            message: 'Google Sheets verileri başarıyla alındı',
            data: result
        });

    } catch (error) {
        logger.error('Google Sheets export hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Google Sheets verileri alınırken hata oluştu',
            error: error.message
        });
    }
});

// Export applications data
router.get('/export/applications', authenticateAdmin, async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;
        
        const indexPath = path.join(__dirname, '../data/applications_index.json');
        let applications = [];

        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            applications = JSON.parse(indexData);
        } catch (error) {
            applications = [];
        }

        // Filter by date if provided
        if (startDate) {
            applications = applications.filter(app => 
                moment(app.createdAt).isAfter(moment(startDate))
            );
        }

        if (endDate) {
            applications = applications.filter(app => 
                moment(app.createdAt).isBefore(moment(endDate))
            );
        }

        // Load full application data
        const fullApplications = [];
        for (const app of applications) {
            try {
                const dataDir = path.join(__dirname, '../data');
                const files = await fs.readdir(dataDir);
                const applicationFile = files.find(file => file.includes(app.id));
                
                if (applicationFile) {
                    const filePath = path.join(dataDir, applicationFile);
                    const applicationData = await fs.readFile(filePath, 'utf8');
                    fullApplications.push(JSON.parse(applicationData));
                }
            } catch (error) {
                logger.error(`Başvuru yüklenemedi: ${app.id}`, error);
            }
        }

        if (format === 'csv') {
            // Convert to CSV
            const csvData = convertToCSV(fullApplications);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="applications_${moment().format('YYYY-MM-DD')}.csv"`);
            res.send(csvData);
        } else {
            // Return JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="applications_${moment().format('YYYY-MM-DD')}.json"`);
            res.json({
                exportDate: new Date().toISOString(),
                totalApplications: fullApplications.length,
                filters: { startDate, endDate },
                applications: fullApplications
            });
        }

        logger.info(`Veri dışa aktarımı: ${fullApplications.length} başvuru, format: ${format}`);

    } catch (error) {
        logger.error('Dışa aktarım hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Veriler dışa aktarılırken hata oluştu'
        });
    }
});

// Helper Functions

async function getDashboardStatistics() {
    try {
        const indexPath = path.join(__dirname, '../data/applications_index.json');
        let applications = [];

        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            applications = JSON.parse(indexData);
        } catch (error) {
            applications = [];
        }

        // Basic statistics
        const totalApplications = applications.length;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const approvedApplications = applications.filter(app => app.status === 'approved').length;
        const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

        // Recent applications (last 7 days)
        const recentApplications = applications.filter(app => 
            moment(app.createdAt).isAfter(moment().subtract(7, 'days'))
        );

        // Daily statistics for last 30 days
        const dailyStats = [];
        for (let i = 29; i >= 0; i--) {
            const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
            const dayApplications = applications.filter(app => 
                moment(app.createdAt).format('YYYY-MM-DD') === date
            );
            
            dailyStats.push({
                date: date,
                count: dayApplications.length,
                pending: dayApplications.filter(app => app.status === 'pending').length,
                approved: dayApplications.filter(app => app.status === 'approved').length,
                rejected: dayApplications.filter(app => app.status === 'rejected').length
            });
        }

        // File statistics
        const uploadsDir = path.join(__dirname, '../uploads');
        let fileCount = 0;
        let totalFileSize = 0;

        try {
            const files = await fs.readdir(uploadsDir);
            fileCount = files.length;
            
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    totalFileSize += stats.size;
                }
            }
        } catch (error) {
            // Uploads directory doesn't exist yet
        }

        return {
            overview: {
                totalApplications,
                pendingApplications,
                approvedApplications,
                rejectedApplications,
                recentApplications: recentApplications.length
            },
            statusDistribution: {
                pending: pendingApplications,
                approved: approvedApplications,
                rejected: rejectedApplications,
                contacted: applications.filter(app => app.status === 'contacted').length
            },
            dailyStatistics: dailyStats,
            fileStatistics: {
                totalFiles: fileCount,
                totalSize: totalFileSize,
                totalSizeFormatted: formatFileSize(totalFileSize)
            },
            recentApplications: recentApplications.slice(0, 10).map(app => ({
                id: app.id,
                fullName: app.fullName,
                email: app.email,
                createdAt: app.createdAt,
                status: app.status
            }))
        };

    } catch (error) {
        logger.error('Dashboard istatistik hatası:', error);
        throw error;
    }
}

async function getDetailedStatistics(period) {
    try {
        const indexPath = path.join(__dirname, '../data/applications_index.json');
        let applications = [];

        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            applications = JSON.parse(indexData);
        } catch (error) {
            applications = [];
        }

        // Filter by period
        let periodStart;
        switch (period) {
            case '7d':
                periodStart = moment().subtract(7, 'days');
                break;
            case '30d':
                periodStart = moment().subtract(30, 'days');
                break;
            case '90d':
                periodStart = moment().subtract(90, 'days');
                break;
            case '1y':
                periodStart = moment().subtract(1, 'year');
                break;
            default:
                periodStart = moment().subtract(30, 'days');
        }

        const filteredApplications = applications.filter(app => 
            moment(app.createdAt).isAfter(periodStart)
        );

        // Growth statistics
        const growthRate = calculateGrowthRate(applications, period);

        // Time-based statistics
        const hourlyDistribution = getHourlyDistribution(filteredApplications);
        const weekdayDistribution = getWeekdayDistribution(filteredApplications);

        return {
            period: period,
            totalApplications: filteredApplications.length,
            growthRate: growthRate,
            statusBreakdown: {
                pending: filteredApplications.filter(app => app.status === 'pending').length,
                approved: filteredApplications.filter(app => app.status === 'approved').length,
                rejected: filteredApplications.filter(app => app.status === 'rejected').length,
                contacted: filteredApplications.filter(app => app.status === 'contacted').length
            },
            timeDistribution: {
                hourly: hourlyDistribution,
                weekday: weekdayDistribution
            }
        };

    } catch (error) {
        logger.error('Detaylı istatistik hatası:', error);
        throw error;
    }
}

async function getSystemInformation() {
    const os = require('os');
    
    return {
        server: {
            platform: os.platform(),
            architecture: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            }
        },
        application: {
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            port: process.env.PORT || 3000
        },
        storage: await getStorageInfo()
    };
}

async function getStorageInfo() {
    try {
        const dataDir = path.join(__dirname, '../data');
        const uploadsDir = path.join(__dirname, '../uploads');
        
        let dataSize = 0;
        let uploadSize = 0;
        let fileCount = 0;

        // Calculate data directory size
        try {
            const dataFiles = await fs.readdir(dataDir);
            for (const file of dataFiles) {
                const filePath = path.join(dataDir, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    dataSize += stats.size;
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }

        // Calculate uploads directory size
        try {
            const uploadFiles = await fs.readdir(uploadsDir);
            for (const file of uploadFiles) {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    uploadSize += stats.size;
                    fileCount++;
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }

        return {
            dataSize: dataSize,
            uploadSize: uploadSize,
            totalSize: dataSize + uploadSize,
            fileCount: fileCount,
            dataSizeFormatted: formatFileSize(dataSize),
            uploadSizeFormatted: formatFileSize(uploadSize),
            totalSizeFormatted: formatFileSize(dataSize + uploadSize)
        };

    } catch (error) {
        logger.error('Storage bilgi hatası:', error);
        return {
            dataSize: 0,
            uploadSize: 0,
            totalSize: 0,
            fileCount: 0
        };
    }
}

function calculateGrowthRate(applications, period) {
    const now = moment();
    let currentPeriodStart, previousPeriodStart;

    switch (period) {
        case '7d':
            currentPeriodStart = now.clone().subtract(7, 'days');
            previousPeriodStart = now.clone().subtract(14, 'days');
            break;
        case '30d':
            currentPeriodStart = now.clone().subtract(30, 'days');
            previousPeriodStart = now.clone().subtract(60, 'days');
            break;
        case '90d':
            currentPeriodStart = now.clone().subtract(90, 'days');
            previousPeriodStart = now.clone().subtract(180, 'days');
            break;
        default:
            currentPeriodStart = now.clone().subtract(30, 'days');
            previousPeriodStart = now.clone().subtract(60, 'days');
    }

    const currentPeriodApplications = applications.filter(app => 
        moment(app.createdAt).isBetween(currentPeriodStart, now)
    ).length;

    const previousPeriodApplications = applications.filter(app => 
        moment(app.createdAt).isBetween(previousPeriodStart, currentPeriodStart)
    ).length;

    if (previousPeriodApplications === 0) {
        return currentPeriodApplications > 0 ? 100 : 0;
    }

    return ((currentPeriodApplications - previousPeriodApplications) / previousPeriodApplications * 100).toFixed(2);
}

function getHourlyDistribution(applications) {
    const hourly = Array(24).fill(0);
    
    applications.forEach(app => {
        const hour = moment(app.createdAt).hour();
        hourly[hour]++;
    });

    return hourly.map((count, hour) => ({
        hour: hour,
        count: count
    }));
}

function getWeekdayDistribution(applications) {
    const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const distribution = Array(7).fill(0);
    
    applications.forEach(app => {
        const weekday = moment(app.createdAt).day();
        distribution[weekday]++;
    });

    return distribution.map((count, day) => ({
        day: weekdays[day],
        count: count
    }));
}

function convertToCSV(applications) {
    if (applications.length === 0) {
        return 'No data available';
    }

    // CSV headers
    const headers = [
        'ID',
        'Ad Soyad',
        'Yaş',
        'Boy',
        'Kilo',
        'Meslek',
        'Email',
        'Telefon',
        'Başvuru Tarihi',
        'Durum'
    ];

    // CSV rows
    const rows = applications.map(app => [
        app.id,
        app.fullName,
        app.age,
        app.height,
        app.weight,
        app.occupation,
        app.email || '',
        app.phone || '',
        app.createdAt,
        app.status
    ]);

    // Convert to CSV format
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return csvContent;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;