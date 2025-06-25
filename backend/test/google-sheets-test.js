require('dotenv').config();
const GoogleSheetsService = require('../utils/googleSheetsService');

async function testGoogleSheets() {
    console.log('🚀 Google Sheets OAuth2 Service Account Test Başlatılıyor...\n');
    
    try {
        // Environment variables kontrolü
        console.log('📋 Environment Variables Kontrolü:');
        console.log(`   GOOGLE_SERVICE_ACCOUNT_KEY_FILE: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? '✅ Tanımlı' : '❌ Eksik'}`);
        console.log(`   GOOGLE_SPREADSHEET_ID: ${process.env.GOOGLE_SPREADSHEET_ID ? '✅ Tanımlı' : '❌ Eksik'}`);
        console.log(`   GOOGLE_SHEET_NAME: ${process.env.GOOGLE_SHEET_NAME || 'Form Responses'}\n`);
        
        // GoogleSheetsService örneği oluştur
        const sheetsService = new GoogleSheetsService();
        
        // Bağlantı testi
        console.log('🔗 Google Sheets bağlantısı test ediliyor...');
        const connectionResult = await sheetsService.testConnection();
        
        if (connectionResult.success) {
            console.log('✅ Google Sheets bağlantısı başarılı!');
            console.log(`   Spreadsheet Adı: ${connectionResult.title}`);
            console.log(`   Sheets Sayısı: ${connectionResult.sheetCount}`);
            console.log(`   Service Account: ${connectionResult.serviceAccount || 'OAuth2 Service Account'}\n`);
        }
        
        // Test form verisi
        const testFormData = {
            fullName: 'Test Kullanıcı',
            age: '30',
            height: '175',
            weight: '70',
            occupation: 'Yazılım Geliştirici',
            healthConditions: ['Hipertansiyon'],
            vitaminDeficiency: ['D Vitamini'],
            bloodTest: 'Son 6 ayda yaptırdım',
            chronicDiseases: ['Diyabet'],
            regularMedication: 'Metformin',
            pastSurgery: 'Apandisit',
            allergies: ['Polen'],
            digestiveIssues: ['Gastrit'],
            bodyType: 'Orta',
            dietChallenges: ['Şeker isteği'],
            dietReadiness: 'Çok hazırım',
            personalNote: 'Test notu',
            mealsPerDay: '3',
            snacking: 'Ara sıra',
            waterIntake: '2-3 litre'
        };
        
        const testMetadata = {
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        };
        
        // Form verisi ekleme testi
        console.log('📝 Test form verisi ekleniyor...');
        const addResult = await sheetsService.addFormData(testFormData, testMetadata);
        
        if (addResult.success) {
            console.log('✅ Test verisi başarıyla eklendi!');
            console.log(`   Güncellenen aralık: ${addResult.updatedRange}`);
            console.log(`   Eklenen satır sayısı: ${addResult.rowsAdded}\n`);
        }
        
        // Verileri okuma testi
        console.log('📊 Veriler okunuyor...');
        const data = await sheetsService.getFormData();
        console.log(`✅ Toplam ${data.length} kayıt bulundu\n`);
        
        // İstatistik testi
        console.log('📈 İstatistikler hesaplanıyor...');
        const stats = await sheetsService.getStatistics();
        console.log('✅ İstatistikler:');
        console.log(`   Toplam form: ${stats.totalSubmissions}`);
        console.log(`   Ortalama yaş: ${stats.averageAge}`);
        console.log(`   Ortalama boy: ${stats.averageHeight} cm`);
        console.log(`   Ortalama kilo: ${stats.averageWeight} kg\n`);
        
        console.log('🎉 Tüm testler başarıyla tamamlandı!');
        console.log('\n📌 Google Sheets URL:');
        console.log(`   https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}/edit`);
        
    } catch (error) {
        console.error('❌ Test başarısız:', error.message);
        console.error('\n🔧 Çözüm önerileri:');
        console.error('1. Service account key dosyasının doğru konumda olduğunu kontrol edin');
        console.error('2. Google Sheets ID\'sinin doğru olduğunu kontrol edin');
        console.error('3. Service account\'un Google Sheets\'e erişim iznine sahip olduğunu kontrol edin');
        console.error('4. Google Sheets\'i service account email\'i ile paylaştığınızdan emin olun');
        console.error(`   Service Account Email: sidrex-sheets-service@sidrex-form.iam.gserviceaccount.com`);
    }
}

testGoogleSheets();