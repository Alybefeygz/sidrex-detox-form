const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const multer = require('multer');

// Utils
const logger = require('../utils/logger');
const GoogleSheetsService = require('../utils/googleSheetsService');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// GoogleSheetsService instance'ı oluştur (sadece yapılandırılmışsa)
let googleSheetsService;
try {
    if (process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_PRIVATE_KEY) {
        googleSheetsService = new GoogleSheetsService();
    }
} catch (error) {
    console.log('Google Sheets service başlatılamadı:', error.message);
}

// Çift gönderim koruması için cache
const recentSubmissions = new Map();

// Son 5 dakika içindeki gönderileri temizle
setInterval(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [key, timestamp] of recentSubmissions.entries()) {
        if (timestamp < fiveMinutesAgo) {
            recentSubmissions.delete(key);
        }
    }
}, 60000); // Her dakika temizle

// Form validation rules
const applicationValidation = [
    // Kişisel Bilgiler
    body('fullName')
        .notEmpty()
        .withMessage('Ad-Soyad zorunludur')
        .isLength({ min: 2, max: 100 })
        .withMessage('Ad-Soyad 2-100 karakter arasında olmalıdır'),
    
    body('age')
        .isInt({ min: 18, max: 100 })
        .withMessage('Yaş 18-100 arasında olmalıdır'),
    
    body('height')
        .isInt({ min: 120, max: 250 })
        .withMessage('Boy 120-250 cm arasında olmalıdır'),
    
    body('weight')
        .isInt({ min: 30, max: 300 })
        .withMessage('Kilo 30-300 kg arasında olmalıdır'),
    
    body('occupation')
        .notEmpty()
        .withMessage('Meslek/yaşam tarzı zorunludur')
        .isLength({ max: 200 })
        .withMessage('Meslek açıklaması en fazla 200 karakter olabilir'),

    // Phone validation (required)
    body('phone')
        .notEmpty()
        .withMessage('Telefon numarası zorunludur')
        .customSanitizer(value => {
            // Telefon numarasını temizle - sadece rakamları bırak
            return value.replace(/\D/g, '');
        })
        .custom(value => {
            // Türk telefon numarası formatlarını kontrol et
            const cleanPhone = value.replace(/\D/g, '');
            
            // 11 haneli (05xxxxxxxxx) veya 13 haneli (+905xxxxxxxxx) olabilir
            if (cleanPhone.length === 11 && cleanPhone.startsWith('05')) {
                return true;
            }
            if (cleanPhone.length === 13 && cleanPhone.startsWith('905')) {
                return true;
            }
            if (cleanPhone.length === 10 && cleanPhone.startsWith('5')) {
                return true;
            }
            
            throw new Error('Geçerli bir Türk telefon numarası giriniz (05XXXXXXXXX formatında)');
        }),

    // Email validation (required)
    body('email')
        .notEmpty()
        .withMessage('E-posta adresi zorunludur')
        .isEmail()
        .withMessage('Geçerli bir email adresi giriniz'),
];

// Yeni başvuru oluştur
router.post('/', applicationValidation, async (req, res) => {
    try {
        // ✅ DEBUG: Gelen veriyi logla
        console.log('\n🔍 Frontend\'den gelen ham veri:');
        console.log('─'.repeat(60));
        console.log('req.body:', JSON.stringify(req.body, null, 2));
        console.log('req.headers:', req.headers);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('─'.repeat(60));
        
        // Çift gönderim koruması
        const userIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const fullName = req.body.fullName;
        const submissionKey = `${userIP}_${fullName}_${userAgent}`;
        
        const now = Date.now();
        if (recentSubmissions.has(submissionKey)) {
            const lastSubmission = recentSubmissions.get(submissionKey);
            const timeDiff = now - lastSubmission;
            
            // Son 2 dakika içinde aynı kullanıcıdan gelen aynı isimle başvuru varsa reddet
            if (timeDiff < 120000) { // 2 dakika = 120000ms
                console.log('❌ Çift gönderim engellendi:', submissionKey);
                return res.status(429).json({
                    success: false,
                    message: 'Son başvurunuzdan çok kısa süre geçmiş. Lütfen 2 dakika bekleyin.',
                    error: 'DUPLICATE_SUBMISSION'
                });
            }
        }
        
        // Bu gönderiyi kaydet
        recentSubmissions.set(submissionKey, now);
        
        // Validation errors check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation hatası',
                errors: errors.array()
            });
        }

        // Generate unique ID and timestamp
        const applicationId = uuidv4();
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        
        // Application data structure
        const applicationData = {
            id: applicationId,
            createdAt: timestamp,
            updatedAt: timestamp,
            status: 'pending', // pending, approved, rejected, contacted
            ...req.body,
            
            // Metadata
            metadata: {
                userAgent: req.get('User-Agent'),
                ip: req.ip || req.connection.remoteAddress,
                referrer: req.get('Referrer') || null,
                submissionTime: new Date().toISOString()
            }
        };

        // Data dosyasına kaydet
        const dataDir = path.join(__dirname, '../data');
        const fileName = `application_${applicationId}_${moment().format('YYYY-MM-DD')}.json`;
        const filePath = path.join(dataDir, fileName);

        await fs.writeFile(filePath, JSON.stringify(applicationData, null, 2));

        // Index dosyasını güncelle (tüm başvuruların listesi için)
        await updateApplicationsIndex(applicationData);

        // Google Sheets'e kaydet
        try {
            const metadata = {
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            };
            
            console.log('\n📊 Google Sheets\'e kaydedilecek veri:');
            console.log('Form Data:', JSON.stringify(req.body, null, 2));
            console.log('Telefon:', req.body.phone);
            console.log('Email:', req.body.email);
            console.log('Metadata:', JSON.stringify(metadata, null, 2));
            
            // Google Sheets sadece yapılandırılmışsa çalıştır
            if (googleSheetsService && process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_PRIVATE_KEY) {
                const sheetsResult = await googleSheetsService.addFormData(req.body, metadata);
                console.log('✅ Google Sheets başarılı:', sheetsResult);
                logger.info('Form data saved to Google Sheets:', sheetsResult);
            } else {
                console.log('⚠️ Google Sheets yapılandırılmamış - sadece local kayıt');
            }
        } catch (sheetsError) {
            console.log('❌ Google Sheets Hatası:', sheetsError.message);
            console.log('Stack:', sheetsError.stack);
            logger.error('Google Sheets kaydetme hatası:', sheetsError);
            // Google Sheets hatası uygulamayı durdurmasın
        }

        // Email servisi kaldırıldı

        // Success response
        res.status(201).json({
            success: true,
            message: 'Başvurunuz başarıyla alındı!',
            data: {
                applicationId: applicationId,
                submissionTime: timestamp,
                status: 'pending'
            }
        });

        logger.info(`Yeni başvuru alındı: ${applicationId} - ${applicationData.fullName}`);

    } catch (error) {
        logger.error('Başvuru kaydetme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvuru kaydedilirken bir hata oluştu',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Tüm başvuruları listele (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate, search } = req.query;
        
        const indexPath = path.join(__dirname, '../data/applications_index.json');
        let applications = [];

        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            applications = JSON.parse(indexData);
        } catch (error) {
            // Index dosyası yoksa boş array döndür
            applications = [];
        }

        // Filtreleme
        let filteredApplications = applications;

        if (status) {
            filteredApplications = filteredApplications.filter(app => app.status === status);
        }

        if (startDate) {
            filteredApplications = filteredApplications.filter(app => 
                moment(app.createdAt).isAfter(moment(startDate))
            );
        }

        if (endDate) {
            filteredApplications = filteredApplications.filter(app => 
                moment(app.createdAt).isBefore(moment(endDate))
            );
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredApplications = filteredApplications.filter(app => 
                app.fullName.toLowerCase().includes(searchLower) ||
                app.email?.toLowerCase().includes(searchLower) ||
                app.phone?.includes(search)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

        // Response
        res.json({
            success: true,
            data: {
                applications: paginatedApplications,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(filteredApplications.length / limit),
                    total: filteredApplications.length,
                    limit: parseInt(limit)
                },
                filters: {
                    status,
                    startDate,
                    endDate,
                    search
                }
            }
        });

    } catch (error) {
        logger.error('Başvuru listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvurular yüklenirken hata oluştu',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Tek başvuru detayını getir (Admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const dataDir = path.join(__dirname, '../data');
        
        // ID ile dosya bul
        const files = await fs.readdir(dataDir);
        const applicationFile = files.find(file => file.includes(id));
        
        if (!applicationFile) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }

        const filePath = path.join(dataDir, applicationFile);
        const applicationData = await fs.readFile(filePath, 'utf8');
        const application = JSON.parse(applicationData);

        res.json({
            success: true,
            data: application
        });

    } catch (error) {
        logger.error('Başvuru detay getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvuru detayları yüklenirken hata oluştu'
        });
    }
});

// Başvuru durumunu güncelle (Admin only)
router.put('/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected', 'contacted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz durum. Geçerli durumlar: ' + validStatuses.join(', ')
            });
        }

        const dataDir = path.join(__dirname, '../data');
        const files = await fs.readdir(dataDir);
        const applicationFile = files.find(file => file.includes(id));
        
        if (!applicationFile) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }

        const filePath = path.join(dataDir, applicationFile);
        const applicationData = await fs.readFile(filePath, 'utf8');
        const application = JSON.parse(applicationData);

        // Update application
        application.status = status;
        application.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
        application.adminNotes = notes || application.adminNotes;

        // Save updated application
        await fs.writeFile(filePath, JSON.stringify(application, null, 2));

        // Update index
        await updateApplicationsIndex(application);

        // Email servisi kaldırıldı

        res.json({
            success: true,
            message: 'Başvuru durumu güncellendi',
            data: {
                id: application.id,
                status: application.status,
                updatedAt: application.updatedAt
            }
        });

        logger.info(`Başvuru durumu güncellendi: ${id} -> ${status}`);

    } catch (error) {
        logger.error('Başvuru durum güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvuru durumu güncellenirken hata oluştu'
        });
    }
});

// Başvuru sil (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const dataDir = path.join(__dirname, '../data');
        
        const files = await fs.readdir(dataDir);
        const applicationFile = files.find(file => file.includes(id));
        
        if (!applicationFile) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }

        const filePath = path.join(dataDir, applicationFile);
        
        // Backup before delete
        const backupDir = path.join(__dirname, '../data/deleted');
        try {
            await fs.access(backupDir);
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
        }

        const backupPath = path.join(backupDir, `deleted_${Date.now()}_${applicationFile}`);
        await fs.copyFile(filePath, backupPath);

        // Delete original file
        await fs.unlink(filePath);

        // Remove from index
        await removeFromApplicationsIndex(id);

        res.json({
            success: true,
            message: 'Başvuru silindi'
        });

        logger.info(`Başvuru silindi: ${id}`);

    } catch (error) {
        logger.error('Başvuru silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvuru silinirken hata oluştu'
        });
    }
});

// Helper Functions

async function updateApplicationsIndex(applicationData) {
    const indexPath = path.join(__dirname, '../data/applications_index.json');
    let applications = [];

    try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        applications = JSON.parse(indexData);
    } catch (error) {
        // Index dosyası yoksa yeni oluştur
        applications = [];
    }

    // Mevcut başvuruyu güncelle veya yeni ekle
    const existingIndex = applications.findIndex(app => app.id === applicationData.id);
    
    const indexEntry = {
        id: applicationData.id,
        fullName: applicationData.fullName,
        email: applicationData.email,
        phone: applicationData.phone,
        createdAt: applicationData.createdAt,
        updatedAt: applicationData.updatedAt,
        status: applicationData.status
    };

    if (existingIndex !== -1) {
        applications[existingIndex] = indexEntry;
    } else {
        applications.push(indexEntry);
    }

    // Sort by creation date (newest first)
    applications.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));

    await fs.writeFile(indexPath, JSON.stringify(applications, null, 2));
}

async function removeFromApplicationsIndex(applicationId) {
    const indexPath = path.join(__dirname, '../data/applications_index.json');
    
    try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        let applications = JSON.parse(indexData);
        
        applications = applications.filter(app => app.id !== applicationId);
        
        await fs.writeFile(indexPath, JSON.stringify(applications, null, 2));
    } catch (error) {
        logger.error('Index güncellenirken hata:', error);
    }
}

module.exports = router; 