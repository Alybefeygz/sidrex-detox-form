const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logFile = process.env.LOG_FILE || './logs/app.log';
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        // Ensure logs directory exists
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.logLevels[level] <= this.logLevels[this.logLevel];
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };
        
        return JSON.stringify(logEntry);
    }

    writeToFile(logEntry) {
        try {
            fs.appendFileSync(this.logFile, logEntry + '\n');
        } catch (error) {
            console.error('Log dosyasına yazılamadı:', error);
        }
    }

    writeToConsole(level, message, meta) {
        const timestamp = new Date().toLocaleString('tr-TR');
        const coloredMessage = this.colorize(level, `[${timestamp}] ${level.toUpperCase()}: ${message}`);
        
        if (Object.keys(meta).length > 0) {
            console.log(coloredMessage);
            console.log(JSON.stringify(meta, null, 2));
        } else {
            console.log(coloredMessage);
        }
    }

    colorize(level, message) {
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m',  // Yellow
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[32m'  // Green
        };
        const reset = '\x1b[0m';
        
        return `${colors[level] || ''}${message}${reset}`;
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        // Always write to console in development
        if (process.env.NODE_ENV === 'development') {
            this.writeToConsole(level, message, meta);
        }

        // Write to file in production or if LOG_FILE is specified
        if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
            const logEntry = this.formatMessage(level, message, meta);
            this.writeToFile(logEntry);
        }
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // Special method for HTTP requests
    request(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            referrer: req.get('Referrer') || null
        };

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
        
        this.log(level, message, logData);
    }

    // Log application startup
    startup(config) {
        this.info('🚀 Uygulama başlatılıyor...', {
            environment: config.environment,
            port: config.port,
            nodeVersion: process.version,
            timestamp: new Date().toISOString()
        });
    }

    // Log application shutdown
    shutdown(reason = 'Unknown') {
        this.info('🛑 Uygulama kapatılıyor...', {
            reason,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    }

    // Clear old logs (keep last N days)
    async clearOldLogs(daysToKeep = 30) {
        try {
            const logDir = path.dirname(this.logFile);
            const files = fs.readdirSync(logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            for (const file of files) {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.birthtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    this.info(`Eski log dosyası silindi: ${file}`);
                }
            }
        } catch (error) {
            this.error('Log temizleme hatası:', error);
        }
    }

    // Get log statistics
    getLogStats() {
        try {
            const stats = fs.statSync(this.logFile);
            return {
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                exists: true
            };
        } catch (error) {
            return {
                size: 0,
                sizeFormatted: '0 Bytes',
                created: null,
                modified: null,
                exists: false
            };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create and export a singleton instance
const logger = new Logger();

// Clean up old logs on startup (in production)
if (process.env.NODE_ENV === 'production') {
    logger.clearOldLogs().catch(error => {
        console.error('Log temizleme başarısız:', error);
    });
}

module.exports = logger; 