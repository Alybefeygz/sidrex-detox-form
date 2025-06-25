const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const logger = require('../utils/logger');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        try {
            await fs.access(uploadPath);
        } catch (error) {
            await fs.mkdir(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `${uniqueSuffix}${extension}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Dosya türü desteklenmiyor. İzin verilen türler: ${allowedTypes.join(', ')}`), false);
    }
};

// Multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 5 // Maximum 5 files at once
    }
});

// File upload endpoint
router.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Hiç dosya yüklenmedi'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            uploadDate: new Date().toISOString(),
            url: `/api/v1/files/${file.filename}`
        }));

        // Log file uploads
        logger.info(`Dosya yüklendi: ${uploadedFiles.length} dosya`, {
            files: uploadedFiles.map(f => ({ name: f.originalName, size: f.size }))
        });

        res.json({
            success: true,
            message: 'Dosyalar başarıyla yüklendi',
            data: {
                files: uploadedFiles,
                count: uploadedFiles.length
            }
        });

    } catch (error) {
        logger.error('Dosya yükleme hatası:', error);
        
        // Multer specific errors
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Dosya boyutu çok büyük',
                    maxSize: `${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024)}MB`
                });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Çok fazla dosya. En fazla 5 dosya yüklenebilir.'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Dosya yüklenirken hata oluştu',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// File download/view endpoint
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Dosya bulunamadı'
            });
        }

        // Get file stats
        const stats = await fs.stat(filePath);
        
        // Determine content type
        const extension = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        };

        if (mimeTypes[extension]) {
            contentType = mimeTypes[extension];
        }

        // Set headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        
        // For images and PDFs, display inline. For others, force download
        if (['.jpg', '.jpeg', '.png', '.gif', '.pdf'].includes(extension)) {
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }

        // Stream the file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

        // Log file access
        logger.info(`Dosya erişimi: ${filename}`, {
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });

    } catch (error) {
        logger.error('Dosya erişim hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dosya yüklenirken hata oluştu'
        });
    }
});

// File info endpoint
router.get('/:filename/info', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', filename);

        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Dosya bulunamadı'
            });
        }

        const stats = await fs.stat(filePath);
        
        res.json({
            success: true,
            data: {
                filename: filename,
                size: stats.size,
                sizeFormatted: formatFileSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                extension: path.extname(filename).toLowerCase(),
                isImage: ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(filename).toLowerCase()),
                isPdf: path.extname(filename).toLowerCase() === '.pdf'
            }
        });

    } catch (error) {
        logger.error('Dosya bilgi hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dosya bilgileri alınırken hata oluştu'
        });
    }
});

// Delete file endpoint (Admin only - require authentication if needed)
router.delete('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', filename);

        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Dosya bulunamadı'
            });
        }

        // Move to deleted folder instead of permanent deletion
        const deletedDir = path.join(__dirname, '../uploads/deleted');
        try {
            await fs.access(deletedDir);
        } catch {
            await fs.mkdir(deletedDir, { recursive: true });
        }

        const deletedPath = path.join(deletedDir, `deleted_${Date.now()}_${filename}`);
        await fs.rename(filePath, deletedPath);

        res.json({
            success: true,
            message: 'Dosya başarıyla silindi'
        });

        logger.info(`Dosya silindi: ${filename}`);

    } catch (error) {
        logger.error('Dosya silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dosya silinirken hata oluştu'
        });
    }
});

// List all uploaded files (Admin only)
router.get('/', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        const files = await fs.readdir(uploadsDir);
        
        const fileList = [];
        
        for (const filename of files) {
            if (filename.startsWith('.')) continue; // Skip hidden files
            
            const filePath = path.join(uploadsDir, filename);
            const stats = await fs.stat(filePath);
            
            // Skip directories
            if (stats.isDirectory()) continue;
            
            fileList.push({
                filename: filename,
                size: stats.size,
                sizeFormatted: formatFileSize(stats.size),
                uploaded: stats.birthtime,
                extension: path.extname(filename).toLowerCase(),
                isImage: ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(filename).toLowerCase()),
                url: `/api/v1/files/${filename}`
            });
        }

        // Sort by upload date (newest first)
        fileList.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

        res.json({
            success: true,
            data: {
                files: fileList,
                count: fileList.length,
                totalSize: fileList.reduce((total, file) => total + file.size, 0),
                totalSizeFormatted: formatFileSize(fileList.reduce((total, file) => total + file.size, 0))
            }
        });

    } catch (error) {
        logger.error('Dosya listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dosyalar listelenirken hata oluştu'
        });
    }
});

// PDF dokümantlarını serve etmek için yeni endpoint
router.get('/documents/:docType', async (req, res) => {
    try {
        const { docType } = req.params;
        let filename = '';
        
        switch(docType) {
            case 'aydinlatma':
                filename = 'SİDREX DETOX KAMPI AYDINLATMA METNİ_REV2.pdf';
                break;
            case 'riza':
                filename = 'SİRDREX DETOX KULLANICI AÇIK RIZA METNİ_REV.pdf';
                break;
            default:
                return res.status(404).json({
                    success: false,
                    message: 'Doküman bulunamadı'
                });
        }
        
        const filePath = path.join(__dirname, '../../frontend/documents', filename);
        
        // Dosya kontrolü
        try {
            await fs.access(filePath);
        } catch (error) {
            logger.error(`PDF doküman dosyası bulunamadı: ${filePath}`);
            return res.status(404).json({
                success: false,
                message: 'Doküman dosyası bulunamadı'
            });
        }
        
        // Iframe için gerekli headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 saat cache
        
        // CORS headers for iframe embedding
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // PDF dosyasını stream et
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
        logger.info(`PDF doküman erişimi: ${filename}`, {
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        
    } catch (error) {
        logger.error('PDF doküman erişim hatası:', error);
        res.status(500).json({
            success: false,
            message: 'PDF yüklenirken hata oluştu'
        });
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router; 