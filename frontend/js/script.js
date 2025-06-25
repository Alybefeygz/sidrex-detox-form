// Backend API konfigürasyonu - Production Ready
const API_CONFIG = {
    baseURL: getApiBaseUrl(),
    endpoints: {
        applications: '/api/v1/applications'
    }
};

// API Base URL'sini ortama göre belirle
function getApiBaseUrl() {
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
    initializeForm();
});

function initializeForm() {
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
            submitForm();
        });
    }
    
    console.log('Form başarıyla başlatıldı');
}

// Koşullu alanları yönetir
function setupConditionalFields() {
    
    // Kan testi sonuçları alanını yönet
    const bloodTestRadios = document.querySelectorAll('input[name="bloodTest"]');
    const bloodTestResults = document.getElementById('bloodTestResults');
    const bloodTestFile = document.getElementById('bloodTestFile');
    
    bloodTestRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                // Eğer kullanıcı "Evet"i seçerse bu alanı göster
                showElement(bloodTestResults);
                bloodTestFile.setAttribute('required', 'required');
            } else {
                // "Hayır" seçilirse alanı gizle
                hideElement(bloodTestResults);
                bloodTestFile.removeAttribute('required');
                bloodTestFile.value = '';
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
}

// Element gösterme fonksiyonu
function showElement(element) {
    element.style.display = 'block';
    element.classList.add('show');
}

// Element gizleme fonksiyonu
function hideElement(element) {
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
}

// Form doğrulama fonksiyonu
function validateForm() {
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim() && field.type !== 'radio' && field.type !== 'checkbox') {
            showFieldError(field, 'Bu alan zorunludur.');
            isValid = false;
        } else if (field.type === 'radio') {
            const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (!isChecked) {
                showFieldError(field, 'Lütfen bir seçenek seçin.');
                isValid = false;
            }
        }
    });
    
    // Yaş kontrolü
    const ageField = document.getElementById('age');
    if (ageField.value && (ageField.value < 18 || ageField.value > 100)) {
        showFieldError(ageField, 'Yaş 18-100 arasında olmalıdır.');
        isValid = false;
    }
    
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
    // Çift gönderim koruması
    if (isFormSubmitting) {
        console.log('Form zaten gönderiliyor, ikinci gönderim engellendi');
        return;
    }
    
    const form = document.getElementById('applicationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Form validasyonunu kontrol et
    if (!validateForm()) {
        return;
    }
    
    // Gönderim durumunu aktif et
    isFormSubmitting = true;
    
    // Loading durumunu aktif et
    form.classList.add('loading');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Gönderiliyor...';
    }
    
    try {
        // Form verilerini topla
        const formData = collectFormData(form);
        
        // Kan testi dosyası var mı kontrol et
        let bloodTestFileUrl = '';
        const bloodTestFile = document.getElementById('bloodTestFile');
        
        if (bloodTestFile && bloodTestFile.files.length > 0) {
            // Dosya yükleme işlemi
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
                    console.log('Dosya başarıyla yüklendi:', bloodTestFileUrl);
                } else {
                    throw new Error(fileResult.message || 'Dosya yüklenirken hata oluştu');
                }
            } catch (fileError) {
                console.error('Dosya yükleme hatası:', fileError);
                throw new Error('Kan testi dosyası yüklenirken hata oluştu: ' + fileError.message);
            }
        }
        
        // Form verilerine dosya URL'sini ekle
        formData.bloodTestFileUrl = bloodTestFileUrl;
        
        // Form verilerini konsola yazdır (geliştirme amaçlı)
        console.log('Form Verileri:', formData);
        
        // Backend'e POST isteği gönder
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
            console.log('Form başarıyla gönderildi:', result);
            
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
        console.error('Form gönderim hatası:', error);
        
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
    }
}

// Form verilerini topla ve formatla
function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    // Radio button grupları
    const radioGroups = ['bloodTest', 'regularMedication', 'pastSurgery', 'bodyType', 'dietReadiness', 'mealsPerDay', 'snacking', 'waterIntake'];
    
    // Tüm form alanlarını işle
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Birden fazla değer varsa array'e çevir (checkbox grupları için)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            // Radio button ise label metnini al
            if (radioGroups.includes(key)) {
                const selectedRadio = document.querySelector(`input[name="${key}"]:checked`);
                if (selectedRadio) {
                    const label = document.querySelector(`label[for="${selectedRadio.id}"]`) || 
                                  selectedRadio.closest('label') || 
                                  selectedRadio.parentElement.querySelector('label');
                    
                    if (label) {
                        data[key] = label.textContent.trim();
                    } else {
                        data[key] = value;
                    }
                } else {
                    data[key] = value;
                }
            } else {
                data[key] = value;
            }
        }
    }
    
    // Checkbox gruplarını array olarak ayarla
    const checkboxGroups = ['healthConditions', 'vitaminDeficiency', 'chronicDiseases', 'allergies', 'digestiveIssues', 'dietChallenges'];
    checkboxGroups.forEach(group => {
        const elements = document.querySelectorAll(`input[name="${group}"]:checked`);
        data[group] = Array.from(elements).map(el => {
            // Checkbox'ın label elementini bul ve metnini al
            const label = document.querySelector(`label[for="${el.id}"]`) || 
                          el.closest('label') || 
                          el.parentElement.querySelector('label');
            
            if (label) {
                // Label'in text content'ini al, sadece checkbox'ın yanındaki metni
                const labelText = label.textContent.trim();
                return labelText;
            }
            
            // Eğer label bulunamazsa value'yu döndür
            return el.value;
        });
    });
    
    // Input detaylarını ana alanlarla birleştir
    // İlaç detayları
    if (data.regularMedication === 'Evet' && data.medicationList) {
        data.regularMedication = `Evet; ${data.medicationList.trim()}`;
        delete data.medicationList; // Artık ayrı alana gerek yok
    }
    
    // Ameliyat detayları
    if (data.pastSurgery === 'Evet' && data.surgeryList) {
        data.pastSurgery = `Evet; ${data.surgeryList.trim()}`;
        delete data.surgeryList; // Artık ayrı alana gerek yok
    }
    
    // Vitamin eksikliği "Diğer" detayları
    if (data.vitaminDeficiency && data.vitaminDeficiency.includes('Diğer') && data.otherVitaminDeficiencyText) {
        const index = data.vitaminDeficiency.indexOf('Diğer');
        data.vitaminDeficiency[index] = `Diğer; ${data.otherVitaminDeficiencyText.trim()}`;
        delete data.otherVitaminDeficiencyText;
    }
    
    // Kronik hastalık "Diğer" detayları
    if (data.chronicDiseases && data.chronicDiseases.includes('Diğer') && data.otherChronicDiseaseText) {
        const index = data.chronicDiseases.indexOf('Diğer');
        data.chronicDiseases[index] = `Diğer; ${data.otherChronicDiseaseText.trim()}`;
        delete data.otherChronicDiseaseText;
    }
    
    // Alerji "Diğer" detayları
    if (data.allergies && data.allergies.includes('Diğer') && data.otherAllergyText) {
        const index = data.allergies.indexOf('Diğer');
        data.allergies[index] = `Diğer; ${data.otherAllergyText.trim()}`;
        delete data.otherAllergyText;
    }
    
    // Vücut tipi "Diğer" detayları
    if (data.bodyType === 'Diğer' && data.otherBodyTypeText) {
        data.bodyType = `Diğer; ${data.otherBodyTypeText.trim()}`;
        delete data.otherBodyTypeText;
    }
    
    // Diyet zorluğu "Diğer" detayları
    if (data.dietChallenges && data.dietChallenges.includes('Diğer') && data.otherDietChallengeText) {
        const index = data.dietChallenges.indexOf('Diğer');
        data.dietChallenges[index] = `Diğer; ${data.otherDietChallengeText.trim()}`;
        delete data.otherDietChallengeText;
    }
    
    // Sayısal alanları number tipine çevir
    const numberFields = ['age', 'height', 'weight'];
    numberFields.forEach(field => {
        if (data[field]) {
            data[field] = parseInt(data[field], 10);
        }
    });
    
    // Boş string'leri null yap
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string' && data[key].trim() === '') {
            data[key] = null;
        }
    });
    
    return data;
}

// Hata mesajı göster
function showErrorMessage(message) {
    // Mevcut hata mesajını kaldır
    const existingError = document.querySelector('.form-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Yeni hata mesajı oluştur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.style.cssText = `
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 12px;
        margin: 20px 0;
        text-align: center;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    // Form üstüne ekle
    const form = document.getElementById('applicationForm');
    form.parentNode.insertBefore(errorDiv, form);
    
    // Sayfa en üste kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 10 saniye sonra mesajı kaldır
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 10000);
}

// Başarı mesajı göster
function showSuccessMessage() {
    // Form container'ını bul
    const container = document.querySelector('.container');
    const form = document.getElementById('applicationForm');
    
    // Ad-soyad değerini al
    const fullName = document.getElementById('fullName').value;
    
    // Form container'ının içeriğini tamamen temizle
    container.innerHTML = '';
    
    // Yeni başarı mesajı içeriğini oluştur
    const successHTML = `
        <div class="simple-success-container">
            <p>Merhaba ${fullName}</p>
            <p>Başvurunuz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.</p>
        </div>
    `;
    
    // Yeni içeriği container'a ekle
    container.innerHTML = successHTML;
    
    // Sayfa en üste kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Form verilerini localStorage'a kaydet
function saveFormData(formData) {
    const dataObject = {};
    for (let [key, value] of formData.entries()) {
        if (dataObject[key]) {
            // Birden fazla değer varsa array'e çevir
            if (Array.isArray(dataObject[key])) {
                dataObject[key].push(value);
            } else {
                dataObject[key] = [dataObject[key], value];
            }
        } else {
            dataObject[key] = value;
        }
    }
    
    dataObject.submissionDate = new Date().toISOString();
    
    try {
        localStorage.setItem('applicationFormData', JSON.stringify(dataObject));
        console.log('Form verileri başarıyla kaydedildi.');
    } catch (error) {
        console.error('Form verileri kaydedilemedi:', error);
    }
}

// Formu sıfırla
function resetForm() {
    const form = document.getElementById('applicationForm');
    form.reset();
    
    // Tüm koşullu alanları gizle
    const conditionalFields = document.querySelectorAll('.conditional-field');
    conditionalFields.forEach(field => hideElement(field));
    
    // Tüm required attribute'larını kaldır
    const conditionalInputs = document.querySelectorAll('.conditional-field input, .conditional-field textarea');
    conditionalInputs.forEach(input => input.removeAttribute('required'));
    
    // Hata mesajlarını temizle
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    console.log('Form başarıyla sıfırlandı.');
}

// Form ilerleme çubuğunu kur
function setupFormProgress() {
    // Progress bar HTML'i oluştur
    const progressHTML = `
        <div class="form-progress">
            <div class="form-progress-bar"></div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', progressHTML);
    
    const progressBar = document.querySelector('.form-progress-bar');
    const form = document.getElementById('applicationForm');
    
    // Form scroll olayını dinle
    window.addEventListener('scroll', function() {
        updateProgress();
    });
    
    // Form değişikliklerini dinle
    form.addEventListener('input', function() {
        updateProgress();
    });
    
    function updateProgress() {
        const formHeight = form.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        const formTop = form.offsetTop;
        
        // Form görünür alanındaysa ilerlemeyi hesapla
        if (scrollTop + windowHeight > formTop && scrollTop < formTop + formHeight) {
            const scrollProgress = Math.max(0, Math.min(100, 
                ((scrollTop + windowHeight - formTop) / formHeight) * 100
            ));
            
            progressBar.style.width = scrollProgress + '%';
        }
    }
}

// Sayfa yüklendiğinde form verilerini geri yükle (isteğe bağlı)
function loadSavedFormData() {
    try {
        const savedData = localStorage.getItem('applicationFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Kullanıcıya veri geri yükleme seçeneği sun
            if (confirm('Daha önce kaydedilmiş form verileriniz bulundu. Geri yüklemek ister misiniz?')) {
                // Form verilerini geri yükle
                Object.keys(data).forEach(key => {
                    if (key !== 'submissionDate') {
                        const field = document.querySelector(`[name="${key}"]`);
                        if (field) {
                            if (field.type === 'checkbox' || field.type === 'radio') {
                                if (Array.isArray(data[key])) {
                                    data[key].forEach(value => {
                                        const specificField = document.querySelector(`[name="${key}"][value="${value}"]`);
                                        if (specificField) specificField.checked = true;
                                    });
                                } else {
                                    const specificField = document.querySelector(`[name="${key}"][value="${data[key]}"]`);
                                    if (specificField) specificField.checked = true;
                                }
                            } else {
                                field.value = data[key];
                            }
                        }
                    }
                });
                
                // Koşullu alanları güncelle
                setTimeout(() => {
                    document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
                        .forEach(input => input.dispatchEvent(new Event('change')));
                }, 100);
            }
        }
    } catch (error) {
        console.error('Kaydedilmiş veriler yüklenemedi:', error);
    }
}

// Sayfa kapatılırken uyarı ver (form doldurulduysa)
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('applicationForm');
    const formData = new FormData(form);
    
    // Form doldurulmuş mu kontrol et
    let hasData = false;
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            hasData = true;
            break;
        }
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
        const formData = new FormData(form);
        saveFormData(formData);
        
        // Bilgi mesajı göster
        console.log('Form verileri kaydedildi (Ctrl+S)');
    }
    
    // Ctrl+R ile form sıfırla
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (confirm('Formu sıfırlamak istediğinizden emin misiniz?')) {
            resetForm();
        }
    }
});