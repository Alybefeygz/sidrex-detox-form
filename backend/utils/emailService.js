const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Check if email configuration is provided
            if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                logger.warn('Email konfigürasyonu bulunamadı. Email servisi devre dışı.');
                return;
            }

            this.transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            this.isConfigured = true;
            logger.info('Email servisi başlatıldı');

        } catch (error) {
            logger.error('Email servis başlatma hatası:', error);
            this.isConfigured = false;
        }
    }

    async verifyConnection() {
        if (!this.isConfigured) {
            throw new Error('Email servisi konfigüre edilmemiş');
        }

        try {
            await this.transporter.verify();
            logger.info('Email bağlantısı başarılı');
            return true;
        } catch (error) {
            logger.error('Email bağlantı hatası:', error);
            throw error;
        }
    }

    async sendEmail(options) {
        if (!this.isConfigured) {
            logger.warn('Email gönderilemiyor - servis konfigüre edilmemiş');
            return false;
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.htmlToText(options.html),
                attachments: options.attachments || []
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            logger.info('Email gönderildi', {
                to: options.to,
                subject: options.subject,
                messageId: result.messageId
            });

            return result;

        } catch (error) {
            logger.error('Email gönderim hatası:', error);
            throw error;
        }
    }

    async sendApplicationNotification(applicationData) {
        if (!this.isConfigured) {
            return false;
        }

        try {
            const subject = 'Yeni Detoks Form Başvurusu';
            const html = this.generateApplicationNotificationHTML(applicationData);

            // Admin'e bildirim gönder
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await this.sendEmail({
                    to: adminEmail,
                    subject: subject,
                    html: html
                });
            }

            // Başvuru sahibine onay maili gönder (eğer email varsa)
            if (applicationData.email) {
                await this.sendApplicationConfirmation(applicationData);
            }

            return true;

        } catch (error) {
            logger.error('Başvuru bildirimi gönderim hatası:', error);
            throw error;
        }
    }

    async sendApplicationConfirmation(applicationData) {
        if (!this.isConfigured || !applicationData.email) {
            return false;
        }

        try {
            const subject = 'Detoks Form Başvurunuz Alındı';
            const html = this.generateConfirmationHTML(applicationData);

            await this.sendEmail({
                to: applicationData.email,
                subject: subject,
                html: html
            });

            return true;

        } catch (error) {
            logger.error('Onay maili gönderim hatası:', error);
            throw error;
        }
    }

    async sendStatusUpdateNotification(applicationData) {
        if (!this.isConfigured || !applicationData.email) {
            return false;
        }

        try {
            const statusMessages = {
                approved: 'Başvurunuz Onaylandı',
                rejected: 'Başvuru Durumu Güncellendi',
                contacted: 'Başvurunuz İnceleniyor'
            };

            const subject = statusMessages[applicationData.status] || 'Başvuru Durumu Güncellendi';
            const html = this.generateStatusUpdateHTML(applicationData);

            await this.sendEmail({
                to: applicationData.email,
                subject: subject,
                html: html
            });

            return true;

        } catch (error) {
            logger.error('Durum güncelleme maili gönderim hatası:', error);
            throw error;
        }
    }

    generateApplicationNotificationHTML(applicationData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .field { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
                .label { font-weight: bold; color: #555; }
                .value { margin-top: 5px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🆕 Yeni Detoks Form Başvurusu</h1>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">Başvuru ID:</div>
                        <div class="value">${applicationData.id}</div>
                    </div>
                    <div class="field">
                        <div class="label">Ad Soyad:</div>
                        <div class="value">${applicationData.fullName}</div>
                    </div>
                    <div class="field">
                        <div class="label">Yaş:</div>
                        <div class="value">${applicationData.age}</div>
                    </div>
                    <div class="field">
                        <div class="label">Boy/Kilo:</div>
                        <div class="value">${applicationData.height} cm / ${applicationData.weight} kg</div>
                    </div>
                    <div class="field">
                        <div class="label">Meslek:</div>
                        <div class="value">${applicationData.occupation}</div>
                    </div>
                    ${applicationData.email ? `
                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value">${applicationData.email}</div>
                    </div>
                    ` : ''}
                    ${applicationData.phone ? `
                    <div class="field">
                        <div class="label">Telefon:</div>
                        <div class="value">${applicationData.phone}</div>
                    </div>
                    ` : ''}
                    <div class="field">
                        <div class="label">Başvuru Tarihi:</div>
                        <div class="value">${applicationData.createdAt}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Bu otomatik bir bildirimdir. Admin panelinden başvuruyu inceleyebilirsiniz.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateConfirmationHTML(applicationData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
                .success { color: #4CAF50; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Başvurunuz Alındı</h1>
                </div>
                <div class="content">
                    <p>Merhaba <strong>${applicationData.fullName}</strong>,</p>
                    
                    <div class="info-box">
                        <p class="success">Detoks form başvurunuz başarıyla alınmıştır!</p>
                        <p><strong>Başvuru ID:</strong> ${applicationData.id}</p>
                        <p><strong>Başvuru Tarihi:</strong> ${applicationData.createdAt}</p>
                    </div>

                    <div class="info-box">
                        <h3>Sonraki Adımlar:</h3>
                        <ul>
                            <li>Başvurunuz uzman ekibimiz tarafından incelenecektir</li>
                            <li>24-48 saat içinde size geri dönüş yapılacaktır</li>
                            <li>Gerekli görüldüğü takdirde ek bilgi veya belge talep edilebilir</li>
                        </ul>
                    </div>

                    <div class="info-box">
                        <h3>İletişim:</h3>
                        <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
                        <p>Bu email adresini referans göstererek başvuru ID'nizle birlikte yazabilirsiniz.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Sidrex Detoks Programı</p>
                    <p>Bu otomatik bir onay emailidir.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateStatusUpdateHTML(applicationData) {
        const statusTexts = {
            approved: {
                title: '🎉 Başvurunuz Onaylandı!',
                message: 'Tebrikler! Detoks programına katılım başvurunuz onaylanmıştır.',
                color: '#4CAF50'
            },
            rejected: {
                title: '📋 Başvuru Durumu',
                message: 'Başvurunuz değerlendirilmiş ve bu sefer uygun görülmemiştir.',
                color: '#FF9800'
            },
            contacted: {
                title: '📞 Başvurunuz İnceleniyor',
                message: 'Başvurunuz inceleme aşamasındadır. Kısa süre içinde sizinle iletişime geçeceğiz.',
                color: '#2196F3'
            }
        };

        const status = statusTexts[applicationData.status] || statusTexts.contacted;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: ${status.color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${status.title}</h1>
                </div>
                <div class="content">
                    <p>Merhaba <strong>${applicationData.fullName}</strong>,</p>
                    
                    <div class="info-box">
                        <p>${status.message}</p>
                        <p><strong>Başvuru ID:</strong> ${applicationData.id}</p>
                        <p><strong>Güncelleme Tarihi:</strong> ${applicationData.updatedAt}</p>
                    </div>

                    ${applicationData.adminNotes ? `
                    <div class="info-box">
                        <h3>Notlar:</h3>
                        <p>${applicationData.adminNotes}</p>
                    </div>
                    ` : ''}

                    <div class="info-box">
                        <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Sidrex Detoks Programı</p>
                    <p>Bu otomatik bir bildirim emailidir.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    htmlToText(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService;