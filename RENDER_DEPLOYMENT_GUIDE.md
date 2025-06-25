# 🚀 Sidrex Detox Form - Render.com Deployment Rehberi

Bu rehber, Sidrex Detox Form projesini Render.com üzerinde sıfırdan nasıl deploy edeceğinizi adım adım anlatmaktadır.

## 📋 Ön Hazırlık

### 1. Gerekli Hesaplar
- [GitHub](https://github.com) hesabı (kod repository için)
- [Render.com](https://render.com) hesabı
- [Google Cloud Console](https://console.cloud.google.com) hesabı (Google Sheets entegrasyonu için)
- Gmail hesabı (email servisi için)

### 2. Proje Yapısı Özeti
Bu proje iki ana bileşenden oluşur:
- **Backend**: Node.js/Express API (Port 3000)
- **Frontend**: Static HTML/CSS/JS dosyaları

## 🏗️ ADIM 1: GitHub Repository Hazırlığı

### 1.1 Repository Kontrolü
```bash
git status
git push origin main  # Kodunuzun GitHub'da güncel olduğundan emin olun
```

### 1.2 Repository URL'ini Not Alın
GitHub repository URL'inizi kopyalayın:
```
https://github.com/KULLANICI_ADI/sidrex-detox-form.git
```

## 🔧 ADIM 2: Google Cloud Console Kurulumu

### 2.1 Google Cloud Console'a Gidin
1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
2. Üst menüden "Proje Seç" butonuna tıklayın
3. "YENİ PROJE" butonuna tıklayın

### 2.2 Yeni Proje Oluşturun
1. **Proje adı**: `sidrex-detox-form`
2. **Kuruluş**: (Boş bırakabilirsiniz)
3. "OLUŞTUR" butonuna tıklayın

### 2.3 Google Sheets API'yi Etkinleştirin
1. Sol menüden "API'ler ve Hizmetler" → "Kütüphane"
2. Arama kutusuna "Google Sheets API" yazın
3. Google Sheets API'ye tıklayın
4. "ETKİNLEŞTİR" butonuna tıklayın

### 2.4 Service Account Oluşturun
1. Sol menüden "API'ler ve Hizmetler" → "Kimlik Bilgileri"
2. "+ KİMLİK BİLGİSİ OLUŞTUR" → "Hizmet hesabı"
3. **Hizmet hesabı adı**: `sidrex-sheets-service`
4. **Hizmet hesabı ID**: (otomatik doldurulur)
5. "OLUŞTUR VE DEVAM ET" butonuna tıklayın
6. **Rol**: "Düzenleyici" seçin
7. "DEVAM" → "BİTTİ"

### 2.5 JSON Key Dosyası İndirin
1. Oluşturulan service account'a tıklayın
2. "ANAHTARLAR" sekmesine gidin
3. "ANAHTAR EKLE" → "Yeni anahtar oluştur"
4. "JSON" seçin ve "OLUŞTUR"
5. İndirilen JSON dosyasını güvenli bir yerde saklayın

### 2.6 Google Sheets Hazırlığı
1. [Google Sheets](https://sheets.google.com)'e gidin
2. Yeni spreadsheet oluşturun
3. Başlık: "Sidrex Detox Form Yanıtları"
4. Spreadsheet URL'sinden ID'yi kopyalayın:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
5. Paylaş butonuna tıklayın
6. Service account email adresini (JSON dosyasında `client_email`) editor olarak ekleyin

## 🖥️ ADIM 3: Backend Deployment (Render.com)

### 3.1 Render.com'a Giriş
1. [Render.com](https://render.com)'a gidin
2. "Sign Up" ile hesap oluşturun veya "Sign In" ile giriş yapın
3. GitHub ile bağlan seçeneğini kullanın

### 3.2 Yeni Web Service Oluşturun
1. Dashboard'da "New +" butonuna tıklayın
2. "Web Service" seçin

### 3.3 Repository Bağlayın
1. "Connect a repository" bölümünde GitHub seçin
2. Repository listesinden `sidrex-detox-form` projenizi seçin
3. "Connect" butonuna tıklayın

### 3.4 Service Ayarlarını Yapılandırın

#### Temel Ayarlar:
- **Name**: `sidrex-detox-backend`
- **Region**: `Frankfurt (EU Central)` (Türkiye'ye en yakın)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

#### Build & Deploy Ayarları:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3.5 Environment Variables Ekleyin
"Environment" sekmesinde aşağıdaki değişkenleri ekleyin:

#### Sunucu Ayarları:
```
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

#### JWT Ayarları:
```
JWT_SECRET=super-guclu-secret-key-buraya-256bit
JWT_EXPIRE=7d
```

#### Email Ayarları (Gmail):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@sidrex.com
```

#### Dosya Upload Ayarları:
```
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
```

#### Rate Limiting:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Admin Ayarları:
```
ADMIN_EMAIL=admin@sidrex.com
ADMIN_PASSWORD=cok-guclu-admin-sifresi-123
```

#### Google Sheets Ayarları:
```
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEET_NAME=Sidrex Detox Form Yanıtları
```

#### Güvenlik Ayarları:
```
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
```

### 3.6 Google Service Account Key Ekleme
Bu hassas dosya için özel method kullanacağız:

1. JSON key dosyasının içeriğini tek satıra çevirin (JSON minify)
2. Environment variable olarak ekleyin:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={minified_json_content}
   ```

**ÖNEMLİ**: JSON dosyasını direkt olarak code base'e eklemeyin!

### 3.7 Frontend Domain Ayarları
Frontend deploy edildikten sonra güncellenecek:
```
FRONTEND_URL=https://your-frontend-domain.onrender.com
PRODUCTION_FRONTEND_DOMAINS=https://your-frontend-domain.onrender.com
```

### 3.8 Deploy Başlatın
1. "Create Web Service" butonuna tıklayın
2. Deploy işlemini izleyin (5-10 dakika sürer)
3. Deploy tamamlandığında backend URL'inizi not alın:
   ```
   https://sidrex-detox-backend.onrender.com
   ```

## 🌐 ADIM 4: Frontend Deployment (Render.com)

### 4.1 Yeni Static Site Oluşturun
1. Render Dashboard'da "New +" → "Static Site"

### 4.2 Repository Ayarları
1. Aynı GitHub repository'sini seçin
2. "Connect" butonuna tıklayın

### 4.3 Static Site Ayarları

#### Temel Ayarlar:
- **Name**: `sidrex-detox-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `echo "No build required"`
- **Publish Directory**: `.` (current directory)

### 4.4 Frontend Konfigürasyonu Güncelleme

Deploy öncesinde `frontend/config.js` dosyasını güncelleyin:

```javascript
window.SIDREX_CONFIG = {
    PRODUCTION_BACKEND_URLS: {
        'sidrex-detox-frontend.onrender.com': 'https://sidrex-detox-backend.onrender.com'
    },
    DEVELOPMENT_BACKEND_URL: 'http://localhost:3000',
    // ... diğer ayarlar aynı kalacak
};
```

### 4.5 Deploy ve Test
1. "Create Static Site" butonuna tıklayın
2. Deploy tamamlandığında frontend URL'inizi not alın:
   ```
   https://sidrex-detox-frontend.onrender.com
   ```

## 🔗 ADIM 5: Backend-Frontend Bağlantısını Tamamlama

### 5.1 Backend Environment'ı Güncelleme
1. Render Dashboard → Backend Service → Environment
2. Şu değişkenleri güncelleyin:
   ```
   FRONTEND_URL=https://sidrex-detox-frontend.onrender.com
   PRODUCTION_FRONTEND_DOMAINS=https://sidrex-detox-frontend.onrender.com
   ```

### 5.2 Deploy'ları Yeniden Başlatın
1. Backend service → "Manual Deploy" → "Deploy latest commit"
2. Frontend site otomatik güncellenecek

## ✅ ADIM 6: Test ve Doğrulama

### 6.1 Backend Health Check
Browser'da şu URL'yi açın:
```
https://sidrex-detox-backend.onrender.com/health
```

Beklenen yanıt:
```json
{
  "status": "OK",
  "message": "Sidrex Detox Form API is running",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 6.2 Frontend Test
```
https://sidrex-detox-frontend.onrender.com
```

### 6.3 Form Test
1. Frontend'de form doldurma
2. Dosya upload testi
3. Email bildirimi testi
4. Google Sheets'te veri kontrolü

## 🔧 ADIM 7: Domain ve SSL Ayarları

### 7.1 Custom Domain (Opsiyonel)
1. Backend Service → Settings → Custom Domains
2. "Add Custom Domain" butonuna tıklayın
3. Domain adınızı girin (örn: `api.sidrex.com`)
4. DNS kayıtlarını domain providerınızda ayarlayın

### 7.2 SSL Sertifikası
Render otomatik olarak Let's Encrypt SSL sertifikası sağlar.

## 📊 ADIM 8: Monitoring ve Maintenance

### 8.1 Render Dashboard Kullanımı

#### Logs Görüntüleme:
1. Service → Logs sekmesi
2. Real-time log akışını izleyin

#### Metrics İzleme:
1. Service → Metrics sekmesi
2. CPU, Memory, Response time grafikleri

#### Environment Variables Güncelleme:
1. Service → Environment sekmesi
2. Değişken ekle/düzenle/sil

### 8.2 Auto-Deploy Ayarları
1. Service → Settings → "Auto-Deploy"
2. GitHub push'larında otomatik deploy
3. İsteğe göre kapatabilirsiniz

### 8.3 Backup ve Güvenlik
- Environment variables'larınızı güvenli yedekleyin
- Google Service Account key'i güncel tutun
- Admin şifrelerini düzenli değiştirin

## 🔒 Güvenlik Best Practices

### JWT Secret Oluşturma
```bash
# Terminal'de güvenli secret oluşturun:
openssl rand -base64 32
```

### Gmail App Password
1. Google Account → Security → 2-Step Verification
2. App passwords → "Mail" → Generate
3. Oluşturulan parolayı EMAIL_PASS'e girin

### Environment Variables Güvenliği
- API keys'leri asla code'a yazmayın
- Production'da güçlü şifreler kullanın
- Render'ın secret environment variables özelliğini kullanın

## 🆘 Troubleshooting

### Build Hataları
- `backend/package.json` dosyasının doğru olduğundan emin olun
- Node.js version uyumluluğunu kontrol edin
- Dependencies'leri kontrol edin

### CORS Hataları
- Backend'de FRONTEND_URL doğru ayarlandığından emin olun
- Browser console'da CORS hata mesajlarını kontrol edin

### Google Sheets Hataları
- Service account email'inin spreadsheet'te editor yetkisi olduğundan emin olun
- GOOGLE_SPREADSHEET_ID'nin doğru olduğunu kontrol edin

### Dosya Upload Hataları
- MAX_FILE_SIZE ve ALLOWED_FILE_TYPES ayarlarını kontrol edin
- Uploads klasörünün yazılabilir olduğundan emin olun

## 📞 Destek ve İletişim

Deployment sırasında sorun yaşarsanız:
1. Render Documentation'ı inceleyin
2. GitHub Issues'tan destek alın
3. Render Community Forum'u kullanın

## 🎉 Deployment Tamamlandı!

Tebrikler! Sidrex Detox Form projeniz artık Render.com'da çalışıyor:

- **Frontend**: https://sidrex-detox-frontend.onrender.com
- **Backend API**: https://sidrex-detox-backend.onrender.com
- **Health Check**: https://sidrex-detox-backend.onrender.com/health

## 📋 Deployment Sonrası Checklist

- [ ] Backend health check çalışıyor
- [ ] Frontend açılıyor ve backend'e bağlanıyor
- [ ] Form submission test edildi
- [ ] Dosya upload çalışıyor
- [ ] Email bildirimleri gönderiliyor
- [ ] Google Sheets'e veri yazılıyor
- [ ] CORS ayarları doğru
- [ ] SSL sertifikaları aktif
- [ ] Environment variables güvenli
- [ ] Auto-deploy ayarlandı
- [ ] Domain (varsa) bağlandı
- [ ] Monitoring setup edildi

---

Bu rehber ile Sidrex Detox Form projenizi Render.com'da başarıyla deploy edebilirsiniz. Her adımı dikkatli takip edin ve gerektiğinde dokümantasyona geri dönün. 