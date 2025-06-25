// Frontend Configuration
// Bu dosya production'da backend URL'lerini dinamik olarak ayarlamak için kullanılır

window.SIDREX_CONFIG = {
    // Production backend URL'leri
    PRODUCTION_BACKEND_URLS: {
        'sidrex.com': 'https://api.sidrex.com',
        'yourfrontenddomain.com': 'https://api.yourfrontenddomain.com',
        'iframe.yourfrontenddomain.com': 'https://api.yourfrontenddomain.com'
    },
    
    // Development URL
    DEVELOPMENT_BACKEND_URL: 'http://localhost:3000',
    
    // Frontend development ports
    DEVELOPMENT_FRONTEND_PORTS: [8080, 8081], // Desteklenen frontend portları
    
    // API endpoints
    ENDPOINTS: {
        applications: '/api/v1/applications',
        files: '/api/v1/files',
        health: '/health'
    },
    
    // File upload settings
    FILE_UPLOAD: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    },
    
    // Form settings
    FORM: {
        autoSave: true,
        autoSaveInterval: 30000, // 30 saniye
        showProgress: true
    }
};

// Eğer config dosyası include edilmemişse varsayılan ayarları kullan
if (typeof window.SIDREX_CONFIG === 'undefined') {
    console.warn('Sidrex config dosyası yüklenmedi, varsayılan ayarlar kullanılıyor');
} 