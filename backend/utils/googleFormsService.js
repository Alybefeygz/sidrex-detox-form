const axios = require('axios');
const logger = require('./logger');

class GoogleFormsService {
    constructor() {
        this.formId = process.env.GOOGLE_FORM_ID;
        this.apiKey = process.env.GOOGLE_API_KEY;
        this.initialized = false;
    }

    async initialize() {
        try {
            if (this.initialized) return;

            if (!this.apiKey) {
                throw new Error('Google API Key bulunamadı. GOOGLE_API_KEY environment variable\'ını ayarlayın.');
            }

            if (!this.formId) {
                throw new Error('Google Form ID bulunamadı. GOOGLE_FORM_ID environment variable\'ını ayarlayın.');
            }

            this.initialized = true;
            logger.info('Google Forms service initialized successfully with API Key');
        } catch (error) {
            logger.error('Google Forms service initialization failed:', error);
            throw new Error('Google Forms service initialization failed');
        }
    }

    async submitFormData(formData, metadata = {}) {
        try {
            if (!this.initialized) await this.initialize();

            // Google Form'a POST request göndermek için özel URL formatı
            const formUrl = `https://docs.google.com/forms/d/${this.formId}/formResponse`;

            // Form verilerini Google Forms field ID'leri ile eşleştirme
            // Bu ID'ler Google Form'dan alınmalı
            const formPayload = this.mapFormDataToGoogleFields(formData);

            const response = await axios.post(formUrl, formPayload, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status < 400; // 300-399 redirect'leri de kabul et
                }
            });

            logger.info('Form data submitted to Google Forms successfully', {
                status: response.status,
                formId: this.formId
            });

            return {
                success: true,
                message: 'Form başarıyla Google Forms\'a gönderildi',
                status: response.status
            };

        } catch (error) {
            logger.error('Error submitting form data to Google Forms:', error);
            throw new Error(`Google Forms submission failed: ${error.message}`);
        }
    }

    mapFormDataToGoogleFields(formData) {
        // Google Form field ID'lerini burada eşleştirmeniz gerekiyor
        // Bu ID'ler Google Form'un kaynak kodundan alınır
        
        const fieldMapping = {
            // Örnek eşleştirmeler - gerçek field ID'lerle değiştirilmeli
            'entry.123456789': formData.fullName || '',
            'entry.987654321': formData.age || '',
            'entry.456789123': formData.height || '',
            'entry.789123456': formData.weight || '',
            'entry.321654987': formData.occupation || '',
            'entry.654321987': Array.isArray(formData.healthConditions) 
                ? formData.healthConditions.join(', ') 
                : formData.healthConditions || '',
            'entry.147258369': Array.isArray(formData.vitaminDeficiency) 
                ? formData.vitaminDeficiency.join(', ') 
                : formData.vitaminDeficiency || '',
            'entry.369258147': formData.bloodTest || '',
            'entry.258147369': Array.isArray(formData.chronicDiseases) 
                ? formData.chronicDiseases.join(', ') 
                : formData.chronicDiseases || '',
            'entry.741852963': formData.regularMedication || '',
            'entry.852963741': formData.pastSurgery || '',
            'entry.963741852': Array.isArray(formData.allergies) 
                ? formData.allergies.join(', ') 
                : formData.allergies || '',
            'entry.159753486': Array.isArray(formData.digestiveIssues) 
                ? formData.digestiveIssues.join(', ') 
                : formData.digestiveIssues || '',
            'entry.486159753': formData.bodyType || '',
            'entry.753486159': Array.isArray(formData.dietChallenges) 
                ? formData.dietChallenges.join(', ') 
                : formData.dietChallenges || '',
            'entry.357159486': formData.dietReadiness || '',
            'entry.159486357': formData.personalNote || '',
            'entry.486357159': formData.mealsPerDay || '',
            'entry.795142638': formData.snacking || '',
            'entry.142638795': formData.waterIntake || ''
        };

        return new URLSearchParams(fieldMapping).toString();
    }

    async testConnection() {
        try {
            if (!this.initialized) await this.initialize();

            // Google Form sayfasına GET request ile test
            const formUrl = `https://docs.google.com/forms/d/${this.formId}/viewform`;
            
            const response = await axios.get(formUrl, {
                timeout: 10000
            });

            return {
                success: true,
                message: 'Google Forms bağlantısı başarılı',
                formId: this.formId,
                status: response.status
            };

        } catch (error) {
            logger.error('Google Forms connection test failed:', error);
            return {
                success: false,
                error: error.message,
                formId: this.formId
            };
        }
    }

    getFormFieldInstructions() {
        return {
            message: 'Google Form field ID\'lerini almak için:',
            steps: [
                '1. Google Form\'unuzun edit sayfasına gidin',
                '2. Tarayıcıda "Sayfa Kaynağını Görüntüle" yapın',
                '3. "entry." ile başlayan field ID\'leri bulun',
                '4. Bu ID\'leri mapFormDataToGoogleFields fonksiyonunda güncelleyin',
                '5. Her form alanı için doğru entry ID\'sini eşleştirin'
            ],
            example: {
                'entry.123456789': 'Ad Soyad alanı için',
                'entry.987654321': 'Yaş alanı için',
                'entry.456789123': 'Boy alanı için'
            }
        };
    }
}

module.exports = new GoogleFormsService(); 