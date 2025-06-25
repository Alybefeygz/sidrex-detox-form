# 🏥 Sidrex Detox Form - Online WhatsApp Grubu Başvuru Sistemi

Modern, güvenli ve kullanıcı dostu online başvuru formu sistemi. Detoks programı için WhatsApp grubu katılım başvurularını yönetir.

## 🚀 Özellikler

- **📱 Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **📄 Dosya Yükleme**: Kan tahlili, kimlik belgesi yükleme
- **📧 Email Bildirimleri**: Otomatik bildirim sistemi
- **📊 Google Sheets Entegrasyonu**: Otomatik veri kaydetme
- **🔒 Güvenli**: Rate limiting, validation, sanitization
- **⚡ Hızlı**: Modern teknolojiler ile optimize edilmiş
- **🎨 Modern UI**: Kullanıcı dostu arayüz tasarımı
- **📱 iframe Desteği**: Mevcut web sitelerine kolayca entegre edilebilir

## 📁 Proje Yapısı

```
Sidrex Detox Form/
├── frontend/                 # Frontend dosyaları
│   ├── index.html           # Ana sayfa
│   ├── iframe-content.html  # Form sayfası (iframe için)
│   ├── config.js            # Frontend konfigürasyonu
│   ├── js/
│   │   └── script.js        # Ana JavaScript dosyası
│   └── css/
│       └── styles.css       # Stil dosyaları
├── backend/                 # Backend API
│   ├── server.js           # Ana server dosyası
│   ├── routes/             # API endpointleri
│   ├── middleware/         # Middleware'ler
│   ├── utils/              # Yardımcı fonksiyonlar
│   ├── package.json        # Backend bağımlılıkları
│   └── README.md           # Backend dokümantasyonu
├── DEPLOYMENT_GUIDE.md     # Deployment rehberi
├── PORT_8081_UPDATE.md     # Port güncelleme notları
└── README.md               # Bu dosya
```

## 🛠️ Teknolojiler

### Frontend
- **HTML5 & CSS3**: Modern web standartları
- **Vanilla JavaScript**: Hafif ve hızlı
- **Responsive Design**: Mobil-first yaklaşım

### Backend
- **Node.js**: Server-side JavaScript
- **Express.js**: Web framework
- **Google Sheets API**: Veri saklama
- **Nodemailer**: Email servisi
- **Multer**: Dosya yükleme
- **JWT**: Authentication
- **Helmet**: Güvenlik

## 🚀 Hızlı Başlangıç

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/Alybefeygz/sidrex-detox-form.git
cd sidrex-detox-form
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
cp env.example .env
# .env dosyasını editörle açın ve değerleri güncelleyin
npm start
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
# Herhangi bir web server ile serve edin
# Örnek: Live Server extension (VS Code)
```

### 4. Google Sheets Kurulumu

1. **Google Cloud Console Ayarları:**
   - [Google Cloud Console](https://console.cloud.google.com/)'a gidin
   - Yeni proje oluşturun
   - Google Sheets API'yi etkinleştirin
   - Service Account oluşturun
   - JSON key dosyasını indirin

2. **Environment Ayarları:**
   ```bash
   # .env dosyasında:
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=your-service-account-key.json
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
   ```

3. **Spreadsheet İzinleri:**
   - Google Sheets'te yeni spreadsheet oluşturun
   - Service account email'ini editor olarak paylaşın

## 📖 Kullanım

### Web Sitesine Entegrasyon

#### iframe ile:
```html
<iframe 
    src="https://yourdomain.com/iframe-content.html" 
    width="100%" 
    height="800px" 
    frameborder="0"
    title="Sidrex Detox Form">
</iframe>
```

#### Widget Script ile:
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

<div id="sidrex-form-container"></div>
```

## 🚀 Deployment

Detaylı deployment rehberi için [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) dosyasını inceleyin.

### Hızlı Deployment Seçenekleri:

#### Frontend:
- **Netlify**: Drag & drop ile deploy
- **Vercel**: GitHub entegrasyonu
- **GitHub Pages**: Ücretsiz hosting

#### Backend:
- **Railway**: Node.js otomatik deploy
- **Render**: Ücretsiz tier
- **Heroku**: Professional deployment

## 📊 Form Alanları

### Kişisel Bilgiler
- Ad Soyad
- Yaş
- Boy/Kilo
- Meslek
- İletişim Bilgileri

### Sağlık Bilgileri
- Kan tahlili yükleme (zorunlu)
- Alerji bilgileri
- Kullanılan ilaçlar
- Sağlık durumu

### Dosya Yükleme
- Kan tahlili (PDF, JPG, PNG)
- Kimlik belgesi (opsiyonel)
- Maksimum 5MB dosya boyutu

## 🔒 Güvenlik

- **Rate Limiting**: API çağrıları sınırlandırılmış
- **Input Validation**: Tüm girişler doğrulanır
- **File Security**: Güvenli dosya yükleme
- **CORS Protection**: Cross-origin requests korunmalı
- **Environment Variables**: Hassas bilgiler güvenli

## 📈 Monitoring

### Backend Health Check
```bash
GET /health
```

### Google Sheets Test
```bash
GET /api/v1/admin/google-sheets/test
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 👥 Destek

- **Email**: support@sidrex.com
- **Documentation**: [Backend README](backend/README.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🔄 Güncellemeler

- **v1.0.0**: İlk stable sürüm
- Google Sheets entegrasyonu
- Güvenli dosya yükleme
- Email bildirim sistemi
- iframe desteği

---

**Not**: Bu sistem sağlık bilgileri topladığı için KVKK/GDPR uyumluluğunu sağlayın ve gerekli yasal onayları alın.

## 🔧 Kurulum

### Backend Kurulumu

1. **Dependencies yükleyin:**
```bash
cd backend
npm install
```

2. **Environment dosyasını yapılandırın:**
```bash
# .env dosyasını oluşturun
cp env.example .env

# .env dosyasını düzenleyin ve gerekli değerleri doldurun
```

⚠️ **GÜVENLİK UYARISI:** Production ortamında mutlaka aşağıdaki değerleri değiştirin:
- `JWT_SECRET`: `openssl rand -base64 32` komutu ile güvenli secret oluşturun
- `ADMIN_PASSWORD`: Güçlü bir şifre belirleyin (min 12 karakter, özel karakter, sayı)
- Google Service Account JSON dosyasını güvenli bir konumda saklayın

## 🔐 Güvenlik

### Kritik Güvenlik Kontrolleri

Push yapmadan önce aşağıdakileri kontrol edin:

1. **Hassas bilgiler commit edilmemiş olmalı:**
   - `.env` dosyaları
   - Service account JSON dosyaları
   - Hardcode edilmiş şifreler/tokenlar

2. **Environment Variables Kontrolü:**
   ```bash
   # Bu değerler production'da mutlaka ayarlanmalı:
   JWT_SECRET=güvenli-rastgele-string
   ADMIN_PASSWORD=güçlü-şifre
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path-to-json
   ```

3. **Güvenlik Taraması:**
   ```bash
   # Hassas bilgileri taramak için:
   grep -r "password\|secret\|key\|token" --exclude-dir=node_modules .
   ```

## 🚀 Deployment