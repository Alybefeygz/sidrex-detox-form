// Backend API konfigürasyonu - Production Ready
const API_CONFIG = {
    baseURL: getApiBaseUrl(),
    endpoints: {
        applications: '/api/v1/applications'
    }
};

// API Base URL'sini ortama göre belirle
function getApiBaseUrl() {
    console.log('🔄 getApiBaseUrl fonksiyonu çağrıldı');
    
    // Eğer sayfa localhost'ta çalışıyorsa development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const backendUrl = window.SIDREX_CONFIG?.DEVELOPMENT_BACKEND_URL || 'http://localhost:3000';
        console.log(`🔧 Development mode detected. Frontend port: ${window.location.port}, Backend: ${backendUrl}`);
        return backendUrl;
    }
    
    // Production'da ise şu URL'leri dene:
    // 1. Eğer BACKEND_URL meta tag'i varsa onu kullan
    const backendUrlMeta = document.querySelector('meta[name="backend-url"]');
    if (backendUrlMeta && backendUrlMeta.content) {
        console.log('🌐 Backend URL from meta tag:', backendUrlMeta.content);
        return backendUrlMeta.content;
    }
    
    // 2. Config dosyasından domain'e göre URL al
    const hostname = window.location.hostname;
    if (window.SIDREX_CONFIG?.PRODUCTION_BACKEND_URLS) {
        for (const [domain, backendUrl] of Object.entries(window.SIDREX_CONFIG.PRODUCTION_BACKEND_URLS)) {
            if (hostname.includes(domain)) {
                console.log(`🌐 Backend URL from config for ${domain}:`, backendUrl);
                return backendUrl;
            }
        }
    }
    
    // 3. Domain'e göre otomatik URL oluştur
    const protocol = window.location.protocol;
    
    // API subdomain kullan veya aynı domain'e /api ekle
    if (hostname.includes('sidrex')) {
        const autoUrl = `${protocol}//api.${hostname}`;
        console.log('🌐 Auto-generated API URL:', autoUrl);
        return autoUrl;
    }
    
    // Varsayılan: aynı domain'de backend çalışıyor varsay
    const defaultUrl = `${protocol}//${hostname}`;
    console.log('🌐 Default backend URL:', defaultUrl);
    return defaultUrl;
}

// DOM içeriği yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sayfa yüklendi, form başlatılıyor...');
    initializeForm();
    setupPDFModal();
    setupAydinlatmaPopup();
    setupRizaPopup();
    console.log('✅ Form ve tüm bileşenler başarıyla başlatıldı');
});

function initializeForm() {
    console.log('🔄 Form başlatma işlemi başladı');
    
    // Tüm dinamik alan yöneticilerini başlat
    setupConditionalFields();
    setupCheckboxLimits();
    setupFormValidation();
    setupFormProgress();
    
    // Form submit event listener'ını ekle
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Sayfa yenilenmesini engelle
            console.log('📝 Form gönderme işlemi başlatıldı');
            submitForm();
        });
    }
    
    console.log('✅ Form başarıyla başlatıldı');
}

// Koşullu alanları yönetir
function setupConditionalFields() {
    console.log('🔄 Koşullu alanlar ayarlanıyor');
    
    // Kan testi sonuçları alanını yönet
    const bloodTestRadios = document.querySelectorAll('input[name="bloodTest"]');
    const bloodTestResults = document.getElementById('bloodTestResults');
    const bloodTestFile = document.getElementById('bloodTestFile');
    
    bloodTestRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log(`🔄 Kan testi seçeneği değiştirildi: ${this.value}`);
            if (this.value === 'yes') {
                showElement(bloodTestResults);
                bloodTestFile.setAttribute('required', 'required');
                console.log('✅ Kan testi sonuç alanı gösterildi');
            } else {
                hideElement(bloodTestResults);
                bloodTestFile.removeAttribute('required');
                bloodTestFile.value = '';
                console.log('✅ Kan testi sonuç alanı gizlendi');
            }
        });
    });

    // Düzenli ilaç kullanımı alanını yönet
    const medicationRadios = document.querySelectorAll('input[name="regularMedication"]');
    const medicationDetails = document.getElementById('medicationDetails');
    const medicationList = document.getElementById('medicationList');
    
    medicationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                // Evet seçilirse ilaç detayları alanını göster
                showElement(medicationDetails);
                medicationList.setAttribute('required', 'required');
            } else {
                // Hayır seçilirse alanı gizle
                hideElement(medicationDetails);
                medicationList.removeAttribute('required');
                medicationList.value = '';
            }
        });
    });

    // Geçmiş ameliyat alanını yönet
    const surgeryRadios = document.querySelectorAll('input[name="pastSurgery"]');
    const surgeryDetails = document.getElementById('surgeryDetails');
    const surgeryList = document.getElementById('surgeryList');
    
    surgeryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                // Evet seçilirse ameliyat detayları alanını göster
                showElement(surgeryDetails);
                surgeryList.setAttribute('required', 'required');
            } else {
                // Hayır seçilirse alanı gizle
                hideElement(surgeryDetails);
                surgeryList.removeAttribute('required');
                surgeryList.value = '';
            }
        });
    });

    // Vitamin eksikliği "Diğer" seçeneğini yönet
    const vitaminOtherCheckbox = document.querySelector('input[name="vitaminDeficiency"][value="other"]');
    const otherVitaminDeficiency = document.getElementById('otherVitaminDeficiency');
    
    vitaminOtherCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showElement(otherVitaminDeficiency);
        } else {
            hideElement(otherVitaminDeficiency);
            document.getElementById('otherVitaminDeficiencyText').value = '';
        }
    });

    // Kronik hastalık "Diğer" seçeneğini yönet
    const chronicOtherCheckbox = document.querySelector('input[name="chronicDiseases"][value="other"]');
    const otherChronicDisease = document.getElementById('otherChronicDisease');
    
    chronicOtherCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showElement(otherChronicDisease);
        } else {
            hideElement(otherChronicDisease);
            document.getElementById('otherChronicDiseaseText').value = '';
        }
    });

    // Alerji "Kuruyemiş" seçeneğini yönet
    const nutsCheckbox = document.querySelector('input[name="allergies"][value="nuts"]');
    const nutsDetail = document.getElementById('nutsDetail');
    
    nutsCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showElement(nutsDetail);
        } else {
            hideElement(nutsDetail);
            document.getElementById('nutsDetailText').value = '';
        }
    });

    // Alerji "Diğer" seçeneğini yönet
    const allergyOtherCheckbox = document.querySelector('input[name="allergies"][value="other"]');
    const otherAllergy = document.getElementById('otherAllergy');
    
    allergyOtherCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showElement(otherAllergy);
        } else {
            hideElement(otherAllergy);
            document.getElementById('otherAllergyText').value = '';
        }
    });

    // Vücut tipi "Diğer" seçeneğini yönet
    const bodyTypeOtherRadio = document.querySelector('input[name="bodyType"][value="other"]');
    const otherBodyType = document.getElementById('otherBodyType');
    const bodyTypeRadios = document.querySelectorAll('input[name="bodyType"]');
    
    bodyTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'other') {
                showElement(otherBodyType);
            } else {
                hideElement(otherBodyType);
                document.getElementById('otherBodyTypeText').value = '';
            }
        });
    });

    // Diyet zorluğu "Diğer" seçeneğini yönet
    const dietChallengeOtherCheckbox = document.querySelector('input[name="dietChallenges"][value="other"]');
    const otherDietChallenge = document.getElementById('otherDietChallenge');
    
    dietChallengeOtherCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showElement(otherDietChallenge);
        } else {
            hideElement(otherDietChallenge);
            document.getElementById('otherDietChallengeText').value = '';
        }
    });
    
    console.log('✅ Tüm koşullu alanlar başarıyla ayarlandı');
}

// Element gösterme fonksiyonu
function showElement(element) {
    console.log(`🔄 Element gösteriliyor: ${element.id || 'Isimsiz element'}`);
    element.style.display = 'block';
    element.classList.add('show');
}

// Element gizleme fonksiyonu
function hideElement(element) {
    console.log(`🔄 Element gizleniyor: ${element.id || 'Isimsiz element'}`);
    element.style.display = 'none';
    element.classList.remove('show');
}

// Checkbox sınır kontrollerini ayarla
function setupCheckboxLimits() {
    
    // "Hiçbiri/Yok" seçenekleri için özel mantık
    setupExclusiveCheckboxes('healthConditions', 'none');
    setupExclusiveCheckboxes('vitaminDeficiency', 'none');
    setupExclusiveCheckboxes('vitaminDeficiency', 'dont_know');
    setupExclusiveCheckboxes('chronicDiseases', 'none');
    setupExclusiveCheckboxes('allergies', 'none');
    setupExclusiveCheckboxes('digestiveIssues', 'none');
    
    // Diyet zorlukları için 3 seçenek sınırı
    setupCheckboxLimit('dietChallenges', 3);
}

// Özel checkbox mantığı - "Hiçbiri" seçilince diğerleri iptal olur
function setupExclusiveCheckboxes(groupName, exclusiveValue) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
    const exclusiveCheckbox = document.querySelector(`input[name="${groupName}"][value="${exclusiveValue}"]`);
    
    if (!exclusiveCheckbox) return;
    
    // Özel seçenek işaretlendiğinde diğerlerini iptal et
    exclusiveCheckbox.addEventListener('change', function() {
        if (this.checked) {
            checkboxes.forEach(checkbox => {
                if (checkbox !== this) {
                    checkbox.checked = false;
                }
            });
        }
    });
    
    // Diğer seçenekler işaretlendiğinde özel seçeneği iptal et
    checkboxes.forEach(checkbox => {
        if (checkbox !== exclusiveCheckbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    exclusiveCheckbox.checked = false;
                }
            });
        }
    });
}

// Checkbox seçim sınırı koyar
function setupCheckboxLimit(groupName, limit) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
    
    // Uyarı mesajı elementi oluştur
    const warningElement = document.createElement('div');
    warningElement.className = 'checkbox-limit-warning';
    warningElement.textContent = `En fazla ${limit} seçenek seçebilirsiniz.`;
    
    // Uyarı mesajını uygun yere ekle
    const firstCheckbox = checkboxes[0];
    if (firstCheckbox) {
        const parentGroup = firstCheckbox.closest('.checkbox-group');
        if (parentGroup) {
            parentGroup.appendChild(warningElement);
        }
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            if (checkedCount > limit) {
                // Sınır aşıldığında son işaretlenen checkbox'ı iptal et
                this.checked = false;
                warningElement.classList.add('show');
                
                // 3 saniye sonra uyarıyı gizle
                setTimeout(() => {
                    warningElement.classList.remove('show');
                }, 3000);
            } else {
                warningElement.classList.remove('show');
            }
        });
    });
}

// Form doğrulama sistemini kur
function setupFormValidation() {
    const form = document.getElementById('applicationForm');
    
    // Eğer form zaten submit event listener'ına sahipse, yeniden ekleme
    if (!form.dataset.eventListenerAdded) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                submitForm();
            }
        });
        
        // Event listener'ın eklendiğini işaretle
        form.dataset.eventListenerAdded = 'true';
    }
    
    // Reset butonu için olay dinleyicisi
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn && !resetBtn.dataset.eventListenerAdded) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Formu sıfırlamak istediğinizden emin misiniz? Tüm veriler kaybolacak.')) {
                resetForm();
            }
        });
        
        // Event listener'ın eklendiğini işaretle
        resetBtn.dataset.eventListenerAdded = 'true';
    }
    
    // KVKK checkbox validasyonu için event listener'lar ekle
    const aydinlatmaMetni = document.getElementById('aydinlatmaMetni');
    const acikRizaMetni = document.getElementById('acikRizaMetni');
    
    if (aydinlatmaMetni) {
        aydinlatmaMetni.addEventListener('change', function() {
            if (this.checked) {
                clearFieldError(this);
            }
        });
    }
    
    if (acikRizaMetni) {
        acikRizaMetni.addEventListener('change', function() {
            if (this.checked) {
                clearFieldError(this);
            }
        });
    }
}

// Form doğrulama fonksiyonu
function validateForm() {
    console.log('🔄 Form doğrulama başladı');
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim() && field.type !== 'radio' && field.type !== 'checkbox') {
            showFieldError(field, 'Bu alan zorunludur.');
            console.log(`❌ Doğrulama hatası: ${field.id || field.name} alanı boş`);
            isValid = false;
        } else if (field.type === 'radio') {
            const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (!isChecked) {
                showFieldError(field, 'Lütfen bir seçenek seçin.');
                console.log(`❌ Doğrulama hatası: ${field.name} seçeneği seçilmemiş`);
                isValid = false;
            }
        } else {
            // Alan geçerliyse hata mesajını temizle
            clearFieldError(field);
        }
    });
    
    // KVKK Onayları kontrolü - yeni validateKVKKApproval fonksiyonunu kullan
    const kvkkValid = validateKVKKApproval();
    if (!kvkkValid) {
        console.log('❌ KVKK onayları eksik');
        isValid = false;
    }
    
    // Yaş kontrolü
    const ageField = document.getElementById('age');
    if (ageField.value && (ageField.value < 18 || ageField.value > 100)) {
        showFieldError(ageField, 'Yaş 18-100 arasında olmalıdır.');
        console.log('❌ Yaş kontrolünde hata');
        isValid = false;
    } else if (ageField.value) {
        clearFieldError(ageField);
    }
    
    console.log(`✅ Form doğrulama tamamlandı. Sonuç: ${isValid ? 'Geçerli' : 'Geçersiz'}`);
    return isValid;
}

// Alan hata mesajı göster
function showFieldError(field, message) {
    // Mevcut hata mesajını kaldır
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Yeni hata mesajı oluştur
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '5px';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
    field.style.borderColor = '#e74c3c';
    
    // Hatayı 5 saniye sonra kaldır
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
        field.style.borderColor = '';
    }, 5000);
}

// Form gönderme durumu kontrolü için global değişken
let isFormSubmitting = false;

// Form gönderme fonksiyonu
async function submitForm() {
    console.log('🔄 Form gönderme işlemi başlatıldı');
    
    if (isFormSubmitting) {
        console.log('⚠️ Form zaten gönderiliyor, ikinci gönderim engellendi');
        return;
    }
    
    const form = document.getElementById('applicationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!validateForm()) {
        console.log('❌ Form doğrulama başarısız, gönderim iptal edildi');
        return;
    }
    
    isFormSubmitting = true;
    console.log('🔄 Form verileri toplanıyor...');
    
    try {
        const formData = collectFormData(form);
        console.log('📦 Toplanan form verileri:', formData);
        
        // Kan testi dosyası var mı kontrol et
        let bloodTestFileUrl = '';
        const bloodTestFile = document.getElementById('bloodTestFile');
        
        if (bloodTestFile && bloodTestFile.files.length > 0) {
            console.log('📤 Kan testi dosyası yükleniyor...');
            const fileFormData = new FormData();
            fileFormData.append('files', bloodTestFile.files[0]);
            
            try {
                const fileResponse = await fetch(API_CONFIG.baseURL + '/api/v1/files/upload', {
                    method: 'POST',
                    body: fileFormData
                });
                
                const fileResult = await fileResponse.json();
                
                if (fileResponse.ok && fileResult.success) {
                    bloodTestFileUrl = API_CONFIG.baseURL + fileResult.data.files[0].url;
                    console.log('✅ Dosya başarıyla yüklendi:', bloodTestFileUrl);
                } else {
                    throw new Error(fileResult.message || 'Dosya yüklenirken hata oluştu');
                }
            } catch (fileError) {
                console.error('❌ Dosya yükleme hatası:', fileError);
                throw new Error('Kan testi dosyası yüklenirken hata oluştu: ' + fileError.message);
            }
        }
        
        // Form verilerine dosya URL'sini ekle
        formData.bloodTestFileUrl = bloodTestFileUrl;
        
        // Form verilerini konsola yazdır (geliştirme amaçlı)
        console.log('📦 Form Verileri:', formData);
        
        // Backend'e POST isteği gönder
        console.log('📤 Form verileri API\'ye gönderiliyor...');
        const response = await fetch(API_CONFIG.baseURL + API_CONFIG.endpoints.applications, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Başarı durumunda
            console.log('✅ Form başarıyla gönderildi');
            
            // Başarı mesajı göster
            showSuccessMessage();
            
            // Form verilerini localStorage'a kaydet (isteğe bağlı)
            saveFormData(formData);
            
            // localStorage'dan form verilerini temizle (başarılı gönderim sonrası)
            localStorage.removeItem('applicationFormData');
            
        } else {
            // Hata durumunda
            throw new Error(result.message || 'Form gönderilirken bir hata oluştu');
        }
        
    } catch (error) {
        console.error('❌ Form gönderme hatası:', error);
        
        // Detaylı hata mesajı
        let errorMessage = 'Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun. (Port 3000)';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS hatası: Backend\'de CORS ayarları kontrol edilmeli.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        console.log('API URL:', API_CONFIG.baseURL + API_CONFIG.endpoints.applications);
        
        // Hata mesajı göster
        showErrorMessage(errorMessage);
        
    } finally {
        // Gönderim durumunu sıfırla
        isFormSubmitting = false;
        
        // Loading durumunu kapat
        form.classList.remove('loading');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Başvuru Gönder';
        }
        console.log('🔄 Form gönderme işlemi tamamlandı');
    }
}

// Form verilerini topla
function collectFormData(form) {
    console.log('🔄 Form verileri toplanıyor');
    const formData = {};
    
    // Temel bilgiler
    formData.name = form.querySelector('#name').value;
    formData.email = form.querySelector('#email').value;
    formData.phone = form.querySelector('#phone').value;
    formData.age = form.querySelector('#age').value;
    formData.gender = form.querySelector('input[name="gender"]:checked')?.value;
    formData.height = form.querySelector('#height').value;
    formData.weight = form.querySelector('#weight').value;
    
    console.log('📝 Temel bilgiler toplandı');
    
    // Sağlık durumu
    formData.healthConditions = Array.from(form.querySelectorAll('input[name="healthConditions"]:checked')).map(cb => cb.value);
    console.log('📝 Sağlık durumu bilgileri toplandı:', formData.healthConditions);
    
    // Vitamin eksikliği
    formData.vitaminDeficiency = Array.from(form.querySelectorAll('input[name="vitaminDeficiency"]:checked')).map(cb => cb.value);
    if (formData.vitaminDeficiency.includes('other')) {
        formData.otherVitaminDeficiencyText = form.querySelector('#otherVitaminDeficiencyText').value;
    }
    console.log('📝 Vitamin eksikliği bilgileri toplandı:', formData.vitaminDeficiency);
    
    // Kronik hastalıklar
    formData.chronicDiseases = Array.from(form.querySelectorAll('input[name="chronicDiseases"]:checked')).map(cb => cb.value);
    if (formData.chronicDiseases.includes('other')) {
        formData.otherChronicDiseaseText = form.querySelector('#otherChronicDiseaseText').value;
    }
    console.log('📝 Kronik hastalık bilgileri toplandı:', formData.chronicDiseases);
    
    // Alerjiler
    formData.allergies = Array.from(form.querySelectorAll('input[name="allergies"]:checked')).map(cb => cb.value);
    if (formData.allergies.includes('nuts')) {
        formData.nutsDetailText = form.querySelector('#nutsDetailText').value;
    }
    if (formData.allergies.includes('other')) {
        formData.otherAllergyText = form.querySelector('#otherAllergyText').value;
    }
    console.log('📝 Alerji bilgileri toplandı:', formData.allergies);
    
    // Sindirim sorunları
    formData.digestiveIssues = Array.from(form.querySelectorAll('input[name="digestiveIssues"]:checked')).map(cb => cb.value);
    console.log('📝 Sindirim sorunları bilgileri toplandı:', formData.digestiveIssues);
    
    // Diğer sağlık bilgileri
    formData.bloodTest = form.querySelector('input[name="bloodTest"]:checked')?.value;
    formData.regularMedication = form.querySelector('input[name="regularMedication"]:checked')?.value;
    if (formData.regularMedication === 'yes') {
        formData.medicationList = form.querySelector('#medicationList').value;
    }
    
    formData.pastSurgery = form.querySelector('input[name="pastSurgery"]:checked')?.value;
    if (formData.pastSurgery === 'yes') {
        formData.surgeryList = form.querySelector('#surgeryList').value;
    }
    console.log('📝 Diğer sağlık bilgileri toplandı');
    
    // Yaşam tarzı bilgileri
    formData.bodyType = form.querySelector('input[name="bodyType"]:checked')?.value;
    if (formData.bodyType === 'other') {
        formData.otherBodyTypeText = form.querySelector('#otherBodyTypeText').value;
    }
    
    formData.dietChallenges = Array.from(form.querySelectorAll('input[name="dietChallenges"]:checked')).map(cb => cb.value);
    if (formData.dietChallenges.includes('other')) {
        formData.otherDietChallengeText = form.querySelector('#otherDietChallengeText').value;
    }
    console.log('📝 Yaşam tarzı bilgileri toplandı');
    
    // KVKK onayları
    formData.kvkkApproval = {
        aydinlatmaMetni: form.querySelector('#aydinlatmaMetni').checked,
        acikRizaMetni: form.querySelector('#acikRizaMetni').checked
    };
    console.log('📝 KVKK onayları toplandı');
    
    console.log('✅ Tüm form verileri başarıyla toplandı');
    return formData;
}

// Hata mesajı göster
function showErrorMessage(message) {
    console.log('❌ Hata mesajı gösteriliyor:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-popup';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>Hata</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">Tamam</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
            console.log('✅ Hata mesajı otomatik kapatıldı');
        }
    }, 5000);
}

// Başarı mesajı göster
function showSuccessMessage() {
    console.log('🎉 Başarı mesajı gösteriliyor');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-popup';
    successDiv.innerHTML = `
        <div class="success-content">
            <h3>Başarılı!</h3>
            <p>Başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.</p>
            <button onclick="this.parentElement.parentElement.remove()">Tamam</button>
        </div>
    `;
    document.body.appendChild(successDiv);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
            console.log('✅ Başarı mesajı otomatik kapatıldı');
        }
    }, 5000);
}

// Form verilerini local storage'a kaydet
function saveFormData(dataObject) {
    console.log('🔄 Form verileri local storage\'a kaydediliyor');
    try {
        localStorage.setItem('formData', JSON.stringify(dataObject));
        console.log('✅ Form verileri başarıyla kaydedildi');
    } catch (error) {
        console.error('❌ Form verileri kaydedilirken hata oluştu:', error);
    }
}

// Formu sıfırla
function resetForm() {
    console.log('🔄 Form sıfırlama işlemi başlatıldı');
    const form = document.getElementById('applicationForm');
    
    // Tüm input alanlarını temizle
    form.reset();
    
    // Koşullu alanları gizle
    const conditionalFields = document.querySelectorAll('.conditional-field');
    conditionalFields.forEach(field => {
        hideElement(field);
    });
    
    // Local storage'ı temizle
    localStorage.removeItem('formData');
    
    // İlerleme çubuğunu sıfırla
    updateProgress();
    
    console.log('✅ Form başarıyla sıfırlandı');
}

// Form ilerleme durumunu ayarla
function setupFormProgress() {
    console.log('🔄 Form ilerleme durumu ayarlanıyor');
    
    const form = document.getElementById('applicationForm');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    
    if (!form || !progressBar || !progressText) {
        console.log('⚠️ İlerleme çubuğu elementleri bulunamadı');
        return;
    }
    
    // Form alanları değiştiğinde ilerlemeyi güncelle
    form.addEventListener('change', updateProgress);
    form.addEventListener('input', updateProgress);
    
    // İlk ilerleme durumunu hesapla
    updateProgress();
    console.log('✅ Form ilerleme durumu ayarlandı');
    
    function updateProgress() {
        console.log('🔄 İlerleme durumu güncelleniyor');
        const requiredFields = form.querySelectorAll('[required]');
        let completedFields = 0;
        
        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                // Radio buttonlar için grup kontrolü
                const radioGroup = form.querySelectorAll(`input[name="${field.name}"]`);
                if (Array.from(radioGroup).some(radio => radio.checked)) {
                    completedFields++;
                }
            } else if (field.type === 'checkbox') {
                if (field.checked) completedFields++;
            } else {
                if (field.value.trim()) completedFields++;
            }
        });
        
        const progress = Math.round((completedFields / requiredFields.length) * 100);
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        console.log(`📊 Form ilerleme durumu: ${progress}%`);
    }
}

// Kaydedilmiş form verilerini yükle
function loadSavedFormData() {
    console.log('🔄 Kaydedilmiş form verileri yükleniyor');
    try {
        const savedData = localStorage.getItem('formData');
        if (!savedData) {
            console.log('ℹ️ Kaydedilmiş form verisi bulunamadı');
            return;
        }
        
        const formData = JSON.parse(savedData);
        const form = document.getElementById('applicationForm');
        
        // Temel bilgileri doldur
        form.querySelector('#name').value = formData.name || '';
        form.querySelector('#email').value = formData.email || '';
        form.querySelector('#phone').value = formData.phone || '';
        form.querySelector('#age').value = formData.age || '';
        
        // Radio butonları doldur
        if (formData.gender) {
            const genderRadio = form.querySelector(`input[name="gender"][value="${formData.gender}"]`);
            if (genderRadio) genderRadio.checked = true;
        }
        
        // Checkbox gruplarını doldur
        if (formData.healthConditions) {
            formData.healthConditions.forEach(value => {
                const checkbox = form.querySelector(`input[name="healthConditions"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        console.log('✅ Kaydedilmiş form verileri başarıyla yüklendi');
        
        // İlerleme çubuğunu güncelle
        updateProgress();
        
    } catch (error) {
        console.error('❌ Form verileri yüklenirken hata oluştu:', error);
    }
}

// Sayfa kapatılırken uyarı ver (form doldurulduysa)
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('applicationForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    // Form doldurulmuş mu kontrol et
    let hasData = false;
    try {
        for (let [key, value] of formData.entries()) {
            if (value && value.toString().trim() !== '') {
                hasData = true;
                break;
            }
        }
    } catch (error) {
        console.log('Form data kontrolünde hata:', error);
    }
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Klavye kısayolları
document.addEventListener('keydown', function(e) {
    // Ctrl+S ile form kaydet
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('applicationForm');
        if (form) {
            const formData = collectFormData(form); // FormData yerine collectFormData kullan
            saveFormData(formData);
            
            // Bilgi mesajı göster
            console.log('Form verileri kaydedildi (Ctrl+S)');
        }
    }
    
    // Ctrl+R ile form sıfırla
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (confirm('Formu sıfırlamak istediğinizden emin misiniz?')) {
            resetForm();
        }
    }
});

// PDF modal ayarlarını yap
function setupPDFModal() {
    console.log('🔄 PDF modal ayarları yapılıyor');
    // Modal kapatma olaylarını dinle
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('click', handleOutsideClick);
    console.log('✅ PDF modal ayarları tamamlandı');
}

// PDF'i yeni sekmede aç
function openPDFNewTab(type) {
    console.log(`🔄 PDF açılıyor: ${type}`);
    let pdfUrl;
    
    if (type === 'aydinlatma') {
        pdfUrl = 'documents/sidrex-açık-riza-metni.pdf';
    } else if (type === 'riza') {
        pdfUrl = 'documents/sidrex-aydinlatma-metni.pdf';
    }
    
    if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        console.log(`✅ PDF yeni sekmede açıldı: ${pdfUrl}`);
    } else {
        console.error('❌ PDF türü geçersiz');
    }
}

// PDF bilgi mesajını göster
function showPDFInfo(titleText) {
    console.log('🔄 PDF bilgi mesajı gösteriliyor');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'pdf-info-popup';
    infoDiv.innerHTML = `
        <div class="pdf-info-content">
            <h3>${titleText}</h3>
            <p>PDF dosyası yeni sekmede açılacaktır.</p>
            <button onclick="this.parentElement.parentElement.remove()">Tamam</button>
        </div>
    `;
    document.body.appendChild(infoDiv);
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
        if (infoDiv.parentNode) {
            infoDiv.remove();
            console.log('✅ PDF bilgi mesajı otomatik kapatıldı');
        }
    }, 3000);
}

// PDF'i inline olarak aç
function openPDFInline(type) {
    console.log(`🔄 PDF inline olarak açılıyor: ${type}`);
    const modal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    
    let pdfUrl;
    if (type === 'aydinlatma') {
        pdfUrl = 'documents/sidrex-açık-riza-metni.pdf';
    } else if (type === 'riza') {
        pdfUrl = 'documents/sidrex-aydinlatma-metni.pdf';
    }
    
    if (pdfUrl && modal && pdfViewer) {
        pdfViewer.src = pdfUrl;
        modal.style.display = 'block';
        console.log(`✅ PDF inline olarak açıldı: ${pdfUrl}`);
    } else {
        console.error('❌ PDF açılırken hata oluştu');
    }
}

// PDF modalını kapat
function closePDFInline() {
    console.log('🔄 PDF modalı kapatılıyor');
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ PDF modalı kapatıldı');
    }
}

// KVKK onaylarını doğrula
function validateKVKKApproval() {
    console.log('🔄 KVKK onayları kontrol ediliyor');
    const aydinlatmaMetni = document.getElementById('aydinlatmaMetni');
    const acikRizaMetni = document.getElementById('acikRizaMetni');
    
    let isValid = true;
    
    if (!aydinlatmaMetni.checked) {
        showFieldError(aydinlatmaMetni, 'Aydınlatma metnini onaylamanız gerekmektedir.');
        console.log('❌ Aydınlatma metni onaylanmamış');
        isValid = false;
    }
    
    if (!acikRizaMetni.checked) {
        showFieldError(acikRizaMetni, 'Açık rıza metnini onaylamanız gerekmektedir.');
        console.log('❌ Açık rıza metni onaylanmamış');
        isValid = false;
    }
    
    console.log(`✅ KVKK onay kontrolü tamamlandı. Sonuç: ${isValid ? 'Geçerli' : 'Geçersiz'}`);
    return isValid;
}

// Alan hata mesajını temizle
function clearFieldError(field) {
    console.log(`🔄 Alan hatası temizleniyor: ${field.id || field.name}`);
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    field.style.borderColor = '';
    console.log('✅ Alan hatası temizlendi');
}

// Aydınlatma metni popup ayarlarını yap
function setupAydinlatmaPopup() {
    console.log('🔄 Aydınlatma metni popup ayarları yapılıyor');
    const openButton = document.querySelector('.open-aydinlatma-btn');
    const closeButton = document.querySelector('.close-aydinlatma-btn');
    const popup = document.querySelector('.aydinlatma-popup');
    
    if (openButton && closeButton && popup) {
        openButton.addEventListener('click', openAydinlatmaPopup);
        closeButton.addEventListener('click', closeAydinlatmaPopup);
        console.log('✅ Aydınlatma metni popup ayarları tamamlandı');
    } else {
        console.error('❌ Aydınlatma metni popup elementleri bulunamadı');
    }
}

// Aydınlatma metni popupını aç
function openAydinlatmaPopup() {
    console.log('🔄 Aydınlatma metni popup açılıyor');
    const popup = document.querySelector('.aydinlatma-popup');
    if (popup) {
        popup.style.display = 'block';
        document.addEventListener('keydown', handleEscapeKey);
        document.addEventListener('click', handleOutsideClick);
        console.log('✅ Aydınlatma metni popup açıldı');
    } else {
        console.error('❌ Aydınlatma metni popup elementi bulunamadı');
    }
}

// Aydınlatma metni popupını kapat
function closeAydinlatmaPopup() {
    console.log('🔄 Aydınlatma metni popup kapatılıyor');
    const popup = document.querySelector('.aydinlatma-popup');
    if (popup) {
        popup.style.display = 'none';
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('click', handleOutsideClick);
        console.log('✅ Aydınlatma metni popup kapatıldı');
    } else {
        console.error('❌ Aydınlatma metni popup elementi bulunamadı');
    }
}

// ESC tuşu ile kapatma
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        console.log('🔄 ESC tuşu ile popup kapatılıyor');
        closeAydinlatmaPopup();
        closeRizaPopup();
        closePDFInline();
    }
}

// Dışarı tıklama ile kapatma
function handleOutsideClick(e) {
    console.log('🔄 Dışarı tıklama kontrolü yapılıyor');
    const aydinlatmaPopup = document.querySelector('.aydinlatma-popup .popup-content');
    const rizaPopup = document.querySelector('.riza-popup .popup-content');
    const pdfModal = document.querySelector('#pdfModal .modal-content');
    
    if (aydinlatmaPopup && !aydinlatmaPopup.contains(e.target)) {
        closeAydinlatmaPopup();
    }
    if (rizaPopup && !rizaPopup.contains(e.target)) {
        closeRizaPopup();
    }
    if (pdfModal && !pdfModal.contains(e.target)) {
        closePDFInline();
    }
}

// Açık rıza metni popup ayarlarını yap
function setupRizaPopup() {
    console.log('🔄 Açık rıza metni popup ayarları yapılıyor');
    const openButton = document.querySelector('.open-riza-btn');
    const closeButton = document.querySelector('.close-riza-btn');
    const popup = document.querySelector('.riza-popup');
    
    if (openButton && closeButton && popup) {
        openButton.addEventListener('click', openRizaPopup);
        closeButton.addEventListener('click', closeRizaPopup);
        console.log('✅ Açık rıza metni popup ayarları tamamlandı');
    } else {
        console.error('❌ Açık rıza metni popup elementleri bulunamadı');
    }
}

// Açık rıza metni popupını aç
function openRizaPopup() {
    console.log('🔄 Açık rıza metni popup açılıyor');
    const popup = document.querySelector('.riza-popup');
    if (popup) {
        popup.style.display = 'block';
        document.addEventListener('keydown', handleRizaEscapeKey);
        document.addEventListener('click', handleRizaOutsideClick);
        console.log('✅ Açık rıza metni popup açıldı');
    } else {
        console.error('❌ Açık rıza metni popup elementi bulunamadı');
    }
}

// Açık rıza metni popupını kapat
function closeRizaPopup() {
    console.log('🔄 Açık rıza metni popup kapatılıyor');
    const popup = document.querySelector('.riza-popup');
    if (popup) {
        popup.style.display = 'none';
        document.removeEventListener('keydown', handleRizaEscapeKey);
        document.removeEventListener('click', handleRizaOutsideClick);
        console.log('✅ Açık rıza metni popup kapatıldı');
    } else {
        console.error('❌ Açık rıza metni popup elementi bulunamadı');
    }
}

// Rıza popup ESC tuşu ile kapatma
function handleRizaEscapeKey(e) {
    if (e.key === 'Escape') {
        console.log('🔄 ESC tuşu ile rıza popup kapatılıyor');
        closeRizaPopup();
    }
}

// Rıza popup dışarı tıklama ile kapatma
function handleRizaOutsideClick(e) {
    console.log('🔄 Rıza popup dışarı tıklama kontrolü yapılıyor');
    const popupContent = document.querySelector('.riza-popup .popup-content');
    if (popupContent && !popupContent.contains(e.target)) {
        closeRizaPopup();
    }
}
