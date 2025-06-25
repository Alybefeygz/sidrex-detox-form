const { google } = require('googleapis');
const logger = require('./logger');
require('dotenv').config();

class GoogleSheetsService {
    constructor() {
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        this.sheetName = process.env.GOOGLE_SHEET_NAME;
        this.initialized = false;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Google Sheets API yapılandırması
            this.auth = new google.auth.GoogleAuth({
                credentials: {
                    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
                    project_id: process.env.GOOGLE_PROJECT_ID,
                    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    auth_uri: process.env.GOOGLE_AUTH_URI,
                    token_uri: process.env.GOOGLE_TOKEN_URI,
                    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
                    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
                    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.initialized = true;
            logger.info('Google Sheets service initialized successfully');
        } catch (error) {
            logger.error('Error initializing Google Sheets service:', error);
            throw error;
        }
    }

    async ensureSheetExists() {
        try {
            if (!this.initialized) await this.initializeAuth();

            // Spreadsheet bilgilerini al
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });

            // Sheet var mı kontrol et
            const existingSheet = spreadsheet.data.sheets.find(
                sheet => sheet.properties.title === this.sheetName
            );

            if (!existingSheet) {
                // Sheet oluştur
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: this.sheetName,
                                }
                            }
                        }]
                    }
                });

                logger.info(`Sheet "${this.sheetName}" created successfully`);
            } else {
                logger.info(`Sheet "${this.sheetName}" already exists, using existing sheet`);
            }

            // Header satırını kontrol et ve ekle
            await this.ensureHeaders();

        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                logger.info(`Sheet "${this.sheetName}" already exists, proceeding with existing sheet`);
                await this.ensureHeaders();
            } else {
                logger.error('Error ensuring sheet exists:', error);
                throw error;
            }
        }
    }

    async ensureHeaders() {
        try {
            // İlk satırı kontrol et
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:Z1`,
            });

            const headers = [
                'Timestamp',
                'Ad Soyad',
                'Yaş',
                'Boy (cm)',
                'Kilo (kg)',
                'Meslek',
                'Sağlık Durumları',
                'Vitamin Eksiklikleri',
                'Kan Testi',
                'Kan PDF\'i',
                'Kronik Hastalıklar',
                'Düzenli İlaçlar',
                'Geçmiş Ameliyatlar',
                'Alerjiler',
                'Sindirim Sorunları',
                'Vücut Tipi',
                'Diyet Zorlukları',
                'Diyet Hazırlığı',
                'Kişisel Not',
                'Günlük Öğün Sayısı',
                'Ara Öğün',
                'Su Tüketimi',
                'Katılımcı Aydınlatma Metnini',
                'Katılımcı Açık Rıza Metnini',
                'IP Adresi',
                'User Agent'
            ];

            // Eğer header yok ise ekle
            if (!response.data.values || response.data.values.length === 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${this.sheetName}!A1:Z1`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [headers]
                    }
                });

                logger.info('Headers added to Google Sheet');
            }

        } catch (error) {
            logger.error('Error ensuring headers:', error);
            throw error;
        }
    }

    formatFormData(formData, metadata = {}) {
        const timestamp = new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul'
        });

        return [
            timestamp,
            formData.fullName || '',
            formData.age || '',
            formData.height || '',
            formData.weight || '',
            formData.occupation || '',
            this.formatArrayField(formData.healthConditions, 'healthConditions'),
            this.formatArrayField(formData.vitaminDeficiency, 'vitaminDeficiency'),
            this.formatSingleField(formData.bloodTest, 'bloodTest'),
            formData.bloodTestFileUrl || '',
            this.formatArrayField(formData.chronicDiseases, 'chronicDiseases'),
            this.formatSingleField(formData.regularMedication, 'regularMedication'),
            this.formatSingleField(formData.pastSurgery, 'pastSurgery'),
            this.formatArrayField(formData.allergies, 'allergies'),
            this.formatArrayField(formData.digestiveIssues, 'digestiveIssues'),
            this.formatSingleField(formData.bodyType, 'bodyType'),
            this.formatArrayField(formData.dietChallenges, 'dietChallenges'),
            this.formatSingleField(formData.dietReadiness, 'dietReadiness'),
            formData.personalNote || '',
            this.formatSingleField(formData.mealsPerDay, 'mealsPerDay'),
            this.formatSingleField(formData.snacking, 'snacking'),
            this.formatSingleField(formData.waterIntake, 'waterIntake'),
            formData.aydinlatmaMetni || '',
            formData.acikRizaMetni || '',
            metadata.ipAddress || '',
            metadata.userAgent || ''
        ];
    }

    formatArrayField(field, fieldType) {
        if (Array.isArray(field)) {
            return field.join(', ');
        }
        return field || '';
    }

    formatSingleField(field, fieldType) {
        return field || '';
    }

    async addFormData(formData, metadata = {}) {
        try {
            if (!this.initialized) await this.initializeAuth();
            await this.ensureSheetExists();

            const values = this.formatFormData(formData, metadata);

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:X`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [values]
                }
            });

            logger.info('Form data added to Google Sheets successfully', {
                range: response.data.updates.updatedRange,
                rowsAdded: response.data.updates.updatedRows
            });

            return {
                success: true,
                updatedRange: response.data.updates.updatedRange,
                rowsAdded: response.data.updates.updatedRows
            };

        } catch (error) {
            logger.error('Error adding form data to Google Sheets:', error);
            throw new Error(`Google Sheets write failed: ${error.message}`);
        }
    }

    async getFormData(range = null) {
        try {
            if (!this.initialized) await this.initializeAuth();

            const queryRange = range || `${this.sheetName}!A:X`;

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: queryRange,
            });

            return {
                success: true,
                data: response.data.values || [],
                range: queryRange
            };

        } catch (error) {
            logger.error('Error getting form data from Google Sheets:', error);
            throw new Error(`Google Sheets read failed: ${error.message}`);
        }
    }

    async getStatistics() {
        try {
            const response = await this.getFormData();
            const data = response.data;

            if (data.length <= 1) { // Sadece header varsa
                return {
                    totalSubmissions: 0,
                    latestSubmission: null,
                    topHealthConditions: [],
                    ageDistribution: {},
                };
            }

            const submissions = data.slice(1); // Header'ı çıkar
            const stats = {
                totalSubmissions: submissions.length,
                latestSubmission: submissions[submissions.length - 1][0], // Timestamp
                topHealthConditions: this.getTopValues(submissions, 6), // Sağlık durumları kolonu
                ageDistribution: this.getAgeDistribution(submissions, 2), // Yaş kolonu
            };

            return stats;

        } catch (error) {
            logger.error('Error getting statistics from Google Sheets:', error);
            throw error;
        }
    }

    getTopValues(submissions, columnIndex, limit = 5) {
        const values = {};
        submissions.forEach(row => {
            if (row[columnIndex]) {
                const items = row[columnIndex].split(', ');
                items.forEach(item => {
                    const trimmed = item.trim();
                    if (trimmed) {
                        values[trimmed] = (values[trimmed] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(values)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    getAgeDistribution(submissions, columnIndex) {
        const distribution = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56+': 0
        };

        submissions.forEach(row => {
            const age = parseInt(row[columnIndex]);
            if (!isNaN(age)) {
                if (age <= 25) distribution['18-25']++;
                else if (age <= 35) distribution['26-35']++;
                else if (age <= 45) distribution['36-45']++;
                else if (age <= 55) distribution['46-55']++;
                else distribution['56+']++;
            }
        });

        return distribution;
    }

    async testConnection() {
        try {
            if (!this.initialized) await this.initializeAuth();

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });

            return {
                success: true,
                spreadsheetTitle: response.data.properties.title,
                sheetCount: response.data.sheets.length
            };

        } catch (error) {
            logger.error('Google Sheets connection test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = GoogleSheetsService; 