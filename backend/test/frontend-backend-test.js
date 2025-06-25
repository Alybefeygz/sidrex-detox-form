require('dotenv').config();
const axios = require('axios');

async function testFrontendBackendConnection() {
    console.log('🔗 Frontend-Backend Bağlantı Testi Başlatılıyor...\n');
    
    const API_BASE_URL = 'http://localhost:3000';
    
    try {
        // 1. Backend health check
        console.log('📡 Backend Health Check...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Backend çalışıyor:', healthResponse.data);
        console.log('');
        
        // 2. Test form verisi (frontend'den gelecek format)
        const testFormData = {
            fullName: 'Test Kullanıcı Frontend',
            age: 25,
            height: 170,
            weight: 65,
            occupation: 'Frontend Developer',
            healthConditions: ['none'],
            vitaminDeficiency: ['vitamin_d', 'iron'],
            bloodTest: 'yes',
            chronicDiseases: ['none'],
            regularMedication: 'Aspirin',
            pastSurgery: 'Yok',
            allergies: ['pollen'],
            digestiveIssues: ['none'],
            bodyType: 'balanced',
            dietChallenges: ['sweet_craving', 'motivation'],
            dietReadiness: 'very_excited',
            personalNote: 'Frontend test verisi',
            mealsPerDay: '3',
            snacking: 'sometimes',
            waterIntake: '2+'
        };
        
        console.log('📤 Test verisi frontend formatında gönderiliyor...');
        console.log('Gönderilen veri:', JSON.stringify(testFormData, null, 2));
        console.log('');
        
        // 3. POST isteği gönder
        const response = await axios.post(`${API_BASE_URL}/api/v1/applications`, testFormData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Form başarıyla gönderildi!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        
        // 4. Gönderilen form verisi
        if (response.data.success) {
            console.log('🎉 Backend başarıyla veriyi aldı!');
            console.log(`Application ID: ${response.data.data.applicationId}`);
            console.log(`Submission Time: ${response.data.data.submissionTime}`);
            console.log(`Status: ${response.data.data.status}`);
        }
        
    } catch (error) {
        console.error('❌ Test başarısız:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('Request error:', error.request);
        }
        
        console.log('\n🔧 Çözüm önerileri:');
        console.log('1. Backend\'in çalıştığından emin olun (npm start)');
        console.log('2. Port 3000\'in açık olduğunu kontrol edin');
        console.log('3. CORS ayarlarını kontrol edin');
        console.log('4. Frontend port\'unun (8081) CORS\'da tanımlı olduğunu kontrol edin');
    }
}

// Detaylı form veri analizi
function analyzeFormData(formData) {
    console.log('\n📊 Form Veri Analizi:');
    console.log('─'.repeat(50));
    
    Object.keys(formData).forEach(key => {
        const value = formData[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`${key}: ${JSON.stringify(value)} (${type})`);
    });
    
    console.log('─'.repeat(50));
}

// Test fonksiyonunu çalıştır
testFrontendBackendConnection(); 