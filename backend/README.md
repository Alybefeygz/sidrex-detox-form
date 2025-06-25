# Sidrex Detox Form Backend API

Modern, güvenli ve ölçeklenebilir Node.js tabanlı backend API'si. Online WhatsApp Grubu Başvuru-Bilgi Formu için geliştirilmiştir.

## 🚀 Özellikler

- **RESTful API**: Modern REST API endpointleri
- **Dosya Yükleme**: Güvenli dosya upload sistemi
- **Email Bildirimleri**: Otomatik email gönderimi
- **Admin Panel**: JWT tabanlı admin yetkilendirmesi
- **Veri Yönetimi**: JSON tabanlı veri saklama
- **Güvenlik**: Rate limiting, CORS, Helmet
- **Logging**: Detaylı log sistemi
- **Validation**: Form doğrulama
- **Error Handling**: Kapsamlı hata yönetimi

## 📋 Gereksinimler

- Node.js 16.0.0+
- npm 8.0.0+

## 🛠️ Kurulum

1. **Dependencies yükleme:**
```bash
npm install
```

2. **Environment değişkenlerini ayarlama:**
```bash
cp env.example .env
```

3. **Environment dosyasını düzenleme:**
```bash
# .env dosyasını editor ile açın ve değerleri güncelleyin
```

4. **Sunucuyu başlatma:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Proje Yapısı

```
backend/
├── routes/
│   ├── applications.js    # Başvuru yönetimi
│   ├── files.js          # Dosya yönetimi
│   └── admin.js          # Admin panel
├── middleware/
│   ├── auth.js           # Authentication
│   └── errorHandler.js   # Error handling
├── utils/
│   ├── logger.js         # Logging sistemi
│   └── emailService.js   # Email servisi
├── data/                 # JSON veri dosyaları
├── uploads/              # Yüklenen dosyalar
├── logs/                 # Log dosyaları
├── server.js             # Ana server dosyası
├── package.json
└── README.md
```

## 🔧 Environment Değişkenleri

### Server Konfigürasyonu
```env
PORT=3000
NODE_ENV=development
API_VERSION=v1
```

### Güvenlik
```env
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
```

### Email Konfigürasyonu
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@sidrex.com
```

### Dosya Yükleme
```env
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Google Sheets Entegrasyonu
```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SPREADSHEET_ID=your_google_spreadsheet_id_here
GOOGLE_SHEET_NAME=Form Responses
```

#### Google Sheets Kurulum Adımları:

1. **Google Cloud Console Ayarları:**
   - [Google Cloud Console](https://console.cloud.google.com/)'a gidin
   - Yeni bir proje oluşturun veya mevcut projeyi seçin
   - **APIs & Services > Library** bölümünden **Google Sheets API**'yi etkinleştirin
   - **APIs & Services > Credentials** bölümünden **API Key** oluşturun
   - API Key'i kopyalayın ve `.env` dosyasındaki `GOOGLE_API_KEY` değerini güncelleyin

2. **Google Sheets Ayarları:**
   - [Google Sheets](https://sheets.google.com)'te yeni bir spreadsheet oluşturun
   - Spreadsheet URL'inden ID'yi kopyalayın (`/spreadsheets/d/SPREADSHEET_ID/edit`)
   - Spreadsheet'i **"Anyone with the link can edit"** olarak paylaşın (API Key erişimi için gerekli)
   - `.env` dosyasındaki `GOOGLE_SPREADSHEET_ID` değerini güncelleyin

3. **Otomatik Features:**
   - Form gönderildiğinde veriler otomatik olarak Google Sheets'e kaydedilir
   - Header satırı otomatik oluşturulur
   - Tarih/saat bilgileri Türkiye saat diliminde kaydedilir
   - IP adresi ve User Agent bilgileri de kaydedilir

⚠️ **Güvenlik Notu:** API Key'inizi güvenli tutun ve production ortamında environment variable olarak saklayın.

## 📚 API Endpoints

### 🏥 Health Check
```
GET /health
```

### 📋 Başvurular
```
POST   /api/v1/applications         # Yeni başvuru oluştur
GET    /api/v1/applications         # Tüm başvuruları listele (Admin)
GET    /api/v1/applications/:id     # Başvuru detayını getir (Admin)
PUT    /api/v1/applications/:id/status  # Başvuru durumunu güncelle (Admin)
DELETE /api/v1/applications/:id     # Başvuru sil (Admin)
```

### 📁 Dosyalar
```
POST   /api/v1/files/upload         # Dosya yükle
GET    /api/v1/files/:filename      # Dosya indir/görüntüle
GET    /api/v1/files/:filename/info # Dosya bilgilerini getir
DELETE /api/v1/files/:filename      # Dosya sil (Admin)
GET    /api/v1/files                # Tüm dosyaları listele (Admin)
```

### 👨‍💼 Admin
```
POST   /api/v1/admin/login          # Admin girişi
GET    /api/v1/admin/dashboard      # Dashboard verileri (Admin)
GET    /api/v1/admin/statistics     # İstatistikler (Admin)
GET    /api/v1/admin/system         # Sistem bilgileri (Admin)
GET    /api/v1/admin/export/applications  # Veri dışa aktarımı (Admin)
```

### 📊 Google Sheets
```
GET    /api/v1/admin/google-sheets/test         # Google Sheets bağlantı testi (Admin)
GET    /api/v1/admin/google-sheets/statistics  # Google Sheets istatistikleri (Admin)
GET    /api/v1/admin/google-sheets/export      # Google Sheets veri dışa aktarımı (Admin)
```

## 📝 API Kullanım Örnekleri

### Yeni Başvuru Oluşturma
```javascript
const response = await fetch('/api/v1/applications', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        fullName: 'Ahmet Yılmaz',
        age: 35,
        height: 175,
        weight: 80,
        occupation: 'Yazılım Geliştirici',
        email: 'ahmet@example.com',
        phone: '+905551234567'
    })
});

const result = await response.json();
console.log(result);
```

### Dosya Yükleme
```javascript
const formData = new FormData();
formData.append('files', file);

const response = await fetch('/api/v1/files/upload', {
    method: 'POST',
    body: formData
});

const result = await response.json();
console.log(result);
```

### Admin Girişi
```javascript
const response = await fetch('/api/v1/admin/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'admin@sidrex.com',
        password: 'your_password'
    })
});

const result = await response.json();
const token = result.data.token;

// Sonraki isteklerde Authorization header'ı kullanın
const adminResponse = await fetch('/api/v1/admin/dashboard', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

## 🔐 Güvenlik Özellikleri

- **JWT Authentication**: Admin paneli için token tabanlı authentication
- **Rate Limiting**: IP bazlı request limitleme
- **CORS**: Cross-Origin Resource Sharing koruması
- **Helmet**: HTTP header güvenlik
- **File Validation**: Dosya türü ve boyut doğrulama
- **Input Validation**: Form giriş doğrulama

## 📊 Logging ve Monitoring

### Log Seviyeleri
- `error`: Kritik hatalar
- `warn`: Uyarılar
- `info`: Genel bilgiler
- `debug`: Debug bilgileri

### Log Dosyaları
- Development: Console'a yazdırılır
- Production: `logs/app.log` dosyasına kaydedilir

## 🚀 Deployment

### Production Build
```bash
# Dependencies yükleme
npm ci --only=production

# Environment değişkenlerini ayarlama
export NODE_ENV=production
export JWT_SECRET=your_production_secret

# Sunucuyu başlatma
npm start
```

### PM2 ile Deployment
```bash
# PM2 yükleme
npm install -g pm2

# Uygulamayı başlatma
pm2 start server.js --name "sidrex-api"

# Otomatik restart için
pm2 startup
pm2 save
```

## 🔧 Geliştirme

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test
```

## 📈 Performans

- **Compression**: Response sıkıştırma
- **Caching**: Uygun HTTP header'ları
- **Rate Limiting**: Sunucu koruması
- **File Streaming**: Büyük dosyalar için streaming

## 🐛 Troubleshooting

### Email Gönderim Sorunları
1. EMAIL_* environment değişkenlerini kontrol edin
2. Gmail için "App Password" kullanın
3. SMTP ayarlarını doğrulayın

### Dosya Yükleme Sorunları
1. Dosya boyutu limitini kontrol edin
2. Dosya türünün desteklendiğini doğrulayın
3. Uploads klasörünün yazma iznini kontrol edin

### Authentication Sorunları
1. JWT_SECRET'in ayarlandığını kontrol edin
2. Token'ın doğru formatta gönderildiğini doğrulayın
3. Token'ın süresinin dolmadığını kontrol edin

## 📞 Destek

Sorunlar ve öneriler için issue açabilirsiniz.

## 📄 Lisans

MIT License

---

**Sidrex Detox Form Backend API** - Modern, güvenli ve ölçeklenebilir backend çözümü. 