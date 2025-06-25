# 🚀 Sidrex Detox Form - Production Deployment Rehberi

## 📋 Deployment Checklist

### **1. Frontend Deployment**

#### **A) Dosya Hazırlığı:**
```bash
# Frontend dosyalarını production için hazırla
frontend/
├── index.html              # Ana sayfa
├── iframe-content.html     # Form sayfası (iframe için)
├── config.js              # Production config
├── js/
│   └── script.js          # Ana JavaScript
└── css/
    └── styles.css         # Stiller
```

#### **B) Backend URL Ayarları:**

**Seçenek 1: Meta Tag ile (Önerilen)**
```html
<!-- iframe-content.html ve index.html head bölümünde -->
<meta name="backend-url" content="https://api.yourdomain.com">
```

**Seçenek 2: config.js dosyasında**
```javascript
// config.js dosyasında domain'inizi ekleyin:
PRODUCTION_BACKEND_URLS: {
    'yourdomain.com': 'https://api.yourdomain.com',
    'www.yourdomain.com': 'https://api.yourdomain.com'
}
```

#### **C) Platform Öneriler:**
- **Netlify** (Ücretsiz): Drag & drop ile frontend klasörünü yükle
- **Vercel** (Ücretsiz): GitHub entegrasyonu ile otomatik deploy
- **GitHub Pages** (Ücretsiz): Repository ayarlarından pages aktif et

---

### **2. Backend Deployment**

#### **A) Environment Variables (.env):**
```bash
# backend/production.env dosyasını .env olarak kopyala
cp production.env .env

# Şu değerleri güncelle:
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
PRODUCTION_FRONTEND_DOMAINS=https://yourdomain.com,https://www.yourdomain.com
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id
```

#### **B) Platform Öneriler:**
- **Railway** (Ücretsiz kullanım): Node.js otomatik detect
- **Render** (Ücretsiz tier): GitHub entegrasyonu
- **Heroku** (Ücretli): Professional deployment
- **DigitalOcean App Platform**: Scalable deployment

#### **C) Deploy Komutu:**
```bash
# Production build
npm install --production
npm start
```

---

### **3. iframe Entegrasyonu**

#### **A) Basit iframe:**
```html
<iframe 
    src="https://yourdomain.com/iframe-content.html" 
    width="100%" 
    height="800px" 
    frameborder="0"
    title="Sidrex Detox Form">
</iframe>
```

#### **B) Responsive iframe:**
```html
<div style="position: relative; width: 100%; height: 0; padding-bottom: 100%;">
    <iframe 
        src="https://yourdomain.com/iframe-content.html"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
        title="Sidrex Detox Form">
    </iframe>
</div>
```

#### **C) Widget Script:**
```html
<script>
(function() {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://yourdomain.com/iframe-content.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    
    document.getElementById('sidrex-form-container').appendChild(iframe);
})();
</script>

<!-- Kullanım: -->
<div id="sidrex-form-container"></div>
```

---

### **4. Domain ve SSL Ayarları**

#### **A) Domain Yapısı:**
```
Frontend: https://form.yourdomain.com
Backend:  https://api.yourdomain.com
```

#### **B) DNS Ayarları:**
```
form.yourdomain.com → Frontend hosting (Netlify/Vercel)
api.yourdomain.com  → Backend hosting (Railway/Render)
```

#### **C) SSL Sertifikası:**
- Çoğu hosting sağlayıcı otomatik SSL verir
- Let's Encrypt kullanarak manuel kurabilirsiniz

---

### **5. Google Sheets Ayarları**

#### **A) Service Account Key:**
```bash
# Google Console'dan aldığınız JSON key dosyasını backend'e yükle
backend/sidrex-form-7b5a65ee4c51.json
```

#### **B) Spreadsheet Ayarları:**
```bash
# .env dosyasında:
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id
GOOGLE_SHEET_NAME=Form Responses
```

#### **C) İzinler:**
- Service Account'a spreadsheet üzerinde "Editor" yetkisi ver
- Share → service account email'ini ekle

---

### **6. Test Senaryosu**

#### **A) Backend Test:**
```bash
# Health check
curl https://api.yourdomain.com/health

# Yanıt:
{
  "status": "OK",
  "message": "Sidrex Detox Form API is running"
}
```

#### **B) Frontend Test:**
1. Form sayfasını açın: `https://yourdomain.com/iframe-content.html`
2. Kan testine "Evet" deyin ve PDF yükleyin
3. Formu doldurup gönderin
4. Google Sheets'te veri geldiğini kontrol edin

#### **C) iframe Test:**
```html
<!-- Test sayfası -->
<iframe src="https://yourdomain.com/iframe-content.html" width="800" height="600"></iframe>
```

---

### **7. Monitoring ve Logs**

#### **A) Backend Logs:**
```bash
# Production'da logs klasörü kontrol edin
tail -f logs/app.log
```

#### **B) Error Tracking:**
- Console log'larını kontrol edin
- Network tab'ında API çağrılarını izleyin
- CORS hatalarını kontrol edin

---

### **8. Güvenlik Kontrolleri**

#### **A) Environment Variables:**
- `.env` dosyası `.gitignore`'da olmalı
- Production'da hassas bilgiler environment'ta olmalı

#### **B) API Rate Limiting:**
- Rate limiting aktif (15 dakikada 100 request)
- CORS sadece belirlenen domainlere açık

#### **C) File Upload Security:**
- Sadece belirli dosya tiplerini kabul eder
- 5MB dosya boyutu sınırı

---

## 🎯 Quick Deploy Adımları

1. **Frontend:** Netlify'a frontend klasörünü drag & drop
2. **Backend:** Railway'e GitHub repo'yu bağla
3. **Environment:** production.env'yi Railway'de .env olarak ayarla
4. **Domain:** DNS'leri ayarla
5. **Test:** iframe'i test et
6. **Production:** Canlıya al!

---

## 🎯 **Test için:**

1. **Localhost'ta test:** `cd frontend && python -m http.server 8081`
2. **Backend başlat:** `cd backend && npm start`
3. **Form test:** `http://localhost:8081/iframe-content.html`
4. **iframe test:** HTML'e iframe kodu yapıştır

---

## 📞 Sorun Giderme

### **Yaygın Hatalar:**

1. **CORS Error:** Backend'deki CORS ayarlarını kontrol et
2. **API Not Found:** Backend URL'lerini kontrol et
3. **File Upload Error:** File upload endpoint'ini test et
4. **Google Sheets Error:** Service account izinlerini kontrol et

### **Debug Komutları:**
```javascript
// Browser console'da API config'i kontrol et
console.log(API_CONFIG);

// Aktif backend URL'sini gör
console.log(getApiBaseUrl());
```

Bu rehberi takip ederek projenizi başarıyla canlıya alabilirsiniz! 🚀 