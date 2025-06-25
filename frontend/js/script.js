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
    setupPDFModal();
    setupAydinlatmaPopup();
    setupRizaPopup();
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
        } else {
            // Alan geçerliyse hata mesajını temizle
            clearFieldError(field);
        }
    });
    
    // KVKK Onayları kontrolü - yeni validateKVKKApproval fonksiyonunu kullan
    const kvkkValid = validateKVKKApproval();
    if (!kvkkValid) {
        isValid = false;
    }
    
    // Yaş kontrolü
    const ageField = document.getElementById('age');
    if (ageField.value && (ageField.value < 18 || ageField.value > 100)) {
        showFieldError(ageField, 'Yaş 18-100 arasında olmalıdır.');
        isValid = false;
    } else if (ageField.value) {
        clearFieldError(ageField);
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
    
    // KVKK Onaylarını ekle
    const aydinlatmaMetni = document.getElementById('aydinlatmaMetni');
    const acikRizaMetni = document.getElementById('acikRizaMetni');
    
    data.aydinlatmaMetni = aydinlatmaMetni.checked ? 'Onaylandı' : 'Onaylanmadı';
    data.acikRizaMetni = acikRizaMetni.checked ? 'Onaylandı' : 'Onaylanmadı';
    
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
    
    // Güvenli ekleme stratejisi
    try {
        const form = document.getElementById('applicationForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(errorDiv, form);
        } else {
            // Eğer form bulunamazsa farklı container'ları dene
            const container = document.querySelector('.container') || 
                            document.querySelector('main') || 
                            document.querySelector('body') || 
                            document.body;
            
            if (container && container.firstChild) {
                container.insertBefore(errorDiv, container.firstChild);
            } else if (container) {
                container.appendChild(errorDiv);
            } else {
                document.body.appendChild(errorDiv);
            }
        }
    } catch (error) {
        console.error('Hata mesajı eklenemedi:', error);
        // Son çare olarak body'ye ekle
        document.body.appendChild(errorDiv);
    }
    
    // Sayfa en üste kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 10 saniye sonra mesajı kaldır
    setTimeout(() => {
        try {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
            }
        } catch (error) {
            console.log('Hata mesajı kaldırılamadı:', error);
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
function saveFormData(dataObject) {
    try {
        // dataObject'in tipini kontrol et
        let finalData = {};
        
        // Eğer FormData ise objeye çevir
        if (dataObject instanceof FormData) {
            for (let [key, value] of dataObject.entries()) {
                if (finalData[key]) {
                    // Birden fazla değer varsa array'e çevir
                    if (Array.isArray(finalData[key])) {
                        finalData[key].push(value);
                    } else {
                        finalData[key] = [finalData[key], value];
                    }
                } else {
                    finalData[key] = value;
                }
            }
        } else if (typeof dataObject === 'object' && dataObject !== null) {
            // Zaten bir obje ise direkt kullan
            finalData = { ...dataObject };
        } else {
            console.error('saveFormData: Geçersiz veri tipi', typeof dataObject);
            return;
        }
        
        finalData.submissionDate = new Date().toISOString();
        
        localStorage.setItem('applicationFormData', JSON.stringify(finalData));
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

// PDF Container fonksiyonları
function setupPDFModal() {
    // Bu fonksiyon artık gerekli değil ama mevcut çağrıları bozmamak için bırakıyoruz
    console.log('PDF sistem hazır - yeni sekmede açılacak');
}

// PDF indirme fonksiyonu
function openPDFNewTab(type) {
    let pdfPath = '';
    let titleText = '';
    let fileName = '';
    
    switch(type) {
        case 'aydinlatma':
            pdfPath = './documents/SİDREX DETOX KAMPI AYDINLATMA METNİ_REV2.pdf';
            titleText = 'Sidrex Detox Kampı Aydınlatma Metni';
            fileName = 'Sidrex_Aydinlatma_Metni.pdf';
            break;
        case 'riza':
            pdfPath = './documents/SİRDREX DETOX KULLANICI AÇIK RIZA METNİ_REV.pdf';
            titleText = 'Sidrex Detox Kullanıcı Açık Rıza Metni';
            fileName = 'Sidrex_Acik_Riza_Metni.pdf';
            break;
        default:
            console.error('Geçersiz PDF türü:', type);
            return;
    }
    
    // PDF'i indirme linkini oluştur
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = fileName;
    link.target = '_blank';
    
    // Link'i DOM'a ekle, tıkla ve kaldır
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Kullanıcıya bilgi ver
    showPDFInfo(titleText, 'download');
    
    console.log('PDF indirme başlatıldı:', titleText);
}

// PDF açıldığında bilgi mesajı göster
function showPDFInfo(titleText) {
    // Mevcut bilgi mesajını kaldır
    const existingInfo = document.querySelector('.pdf-info-message');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Yeni bilgi mesajı oluştur
    const infoMessage = document.createElement('div');
    infoMessage.className = 'pdf-info-message';
    infoMessage.innerHTML = `
        <div class="pdf-info-content">
            ✅ <strong>${titleText}</strong> yeni sekmede açıldı.
            <br>
            <small>Dokümanı okuduktan sonra bu sekmeye geri dönüp onayları işaretleyebilirsiniz.</small>
        </div>
    `;
    
    // Documents section'a ekle
    const documentsSection = document.querySelector('.documents-section');
    if (documentsSection) {
        documentsSection.appendChild(infoMessage);
        
        // 5 saniye sonra mesajı otomatik kaldır
        setTimeout(() => {
            if (infoMessage && infoMessage.parentNode) {
                infoMessage.remove();
            }
        }, 5000);
    }
}

// Eski inline fonksiyonları - geriye dönük uyumluluk için
function openPDFInline(type) {
    // Yeni sekmede açmaya yönlendir
    openPDFNewTab(type);
}

function closePDFInline() {
    // Artık kullanılmıyor
    console.log('Inline PDF kapatma - artık kullanılmıyor');
}

// KVKK validasyon fonksiyonlarını güncelle
function validateKVKKApproval() {
    const aydinlatmaMetni = document.getElementById('aydinlatmaMetni');
    const acikRizaMetni = document.getElementById('acikRizaMetni');
    let isValid = true;
    
    if (!aydinlatmaMetni.checked) {
        showFieldError(aydinlatmaMetni, 'Katılımcı Aydınlatma Metnini okumanız ve onaylamanız zorunludur.');
        isValid = false;
    } else {
        clearFieldError(aydinlatmaMetni);
    }
    
    if (!acikRizaMetni.checked) {
        showFieldError(acikRizaMetni, 'Katılımcı Açık Rıza Metnini okumanız ve onaylamanız zorunludur.');
        isValid = false;
    } else {
        clearFieldError(acikRizaMetni);
    }
    
    return isValid;
}

// Hata mesajını temizleme fonksiyonu
function clearFieldError(field) {
    // Hata mesajını kaldır
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Hata stillerini kaldır
    field.classList.remove('error');
    if (field.type === 'checkbox' || field.type === 'radio') {
        const labels = field.closest('.checkbox-group, .radio-group')?.querySelectorAll('label');
        labels?.forEach(label => label.classList.remove('error'));
    }
}

// Aydınlatma Metni Popup Fonksiyonları
function setupAydinlatmaPopup() {
    const aydinlatmaCheckbox = document.getElementById('aydinlatmaMetni');
    
    if (aydinlatmaCheckbox) {
        aydinlatmaCheckbox.addEventListener('click', function(e) {
            // Checkbox'ın işaretlenmesini engelle
            e.preventDefault();
            
            // Popup'ı aç
            openAydinlatmaPopup();
        });
    }
}

function openAydinlatmaPopup() {
    const popup = document.getElementById('aydinlatmaMetniPopup');
    if (popup) {
        popup.style.display = 'flex';
        
        // Body scroll'unu engelle
        document.body.style.overflow = 'hidden';
        
        // ESC tuşu ile kapatma
        document.addEventListener('keydown', handleEscapeKey);
        
        // Popup dışına tıklama ile kapatma
        popup.addEventListener('click', handleOutsideClick);
        
        console.log('Aydınlatma metni popup açıldı');
    }
}

function closeAydinlatmaPopup() {
    const popup = document.getElementById('aydinlatmaMetniPopup');
    const checkbox = document.getElementById('aydinlatmaMetni');
    
    if (popup) {
        popup.style.display = 'none';
        
        // Body scroll'unu geri aç
        document.body.style.overflow = '';
        
        // Event listener'ları kaldır
        document.removeEventListener('keydown', handleEscapeKey);
        popup.removeEventListener('click', handleOutsideClick);
        
        // Checkbox'ı işaretle
        if (checkbox) {
            checkbox.checked = true;
            
            // Checkbox'a tıklama eventini geçici olarak kaldır
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            // Yeni checkbox'a normal davranış ekle
            setTimeout(() => {
                setupAydinlatmaPopup();
            }, 100);
        }
        
        console.log('Aydınlatma metni popup kapatıldı ve onay verildi');
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeAydinlatmaPopup();
    }
}

function handleOutsideClick(e) {
    if (e.target === e.currentTarget) {
        closeAydinlatmaPopup();
    }
}

// Rıza Metni Popup Fonksiyonları
function setupRizaPopup() {
    const rizaCheckbox = document.getElementById('acikRizaMetni');
    
    if (rizaCheckbox) {
        rizaCheckbox.addEventListener('click', function(e) {
            // Checkbox'ın işaretlenmesini engelle
            e.preventDefault();
            
            // Popup'ı aç
            openRizaPopup();
        });
    }
}

function openRizaPopup() {
    const popup = document.getElementById('rizaMetniPopup');
    if (popup) {
        popup.style.display = 'flex';
        
        // Body scroll'unu engelle
        document.body.style.overflow = 'hidden';
        
        // ESC tuşu ile kapatma
        document.addEventListener('keydown', handleRizaEscapeKey);
        
        // Popup dışına tıklama ile kapatma
        popup.addEventListener('click', handleRizaOutsideClick);
        
        console.log('Rıza metni popup açıldı');
    }
}

function closeRizaPopup() {
    const popup = document.getElementById('rizaMetniPopup');
    const checkbox = document.getElementById('acikRizaMetni');
    
    if (popup) {
        popup.style.display = 'none';
        
        // Body scroll'unu geri aç
        document.body.style.overflow = '';
        
        // Event listener'ları kaldır
        document.removeEventListener('keydown', handleRizaEscapeKey);
        popup.removeEventListener('click', handleRizaOutsideClick);
        
        // Checkbox'ı işaretle
        if (checkbox) {
            checkbox.checked = true;
            
            // Checkbox'a tıklama eventini geçici olarak kaldır
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            // Yeni checkbox'a normal davranış ekle
            setTimeout(() => {
                setupRizaPopup();
            }, 100);
        }
        
        console.log('Rıza metni popup kapatıldı ve onay verildi');
    }
}

function handleRizaEscapeKey(e) {
    if (e.key === 'Escape') {
        closeRizaPopup();
    }
}

function handleRizaOutsideClick(e) {
    if (e.target === e.currentTarget) {
        closeRizaPopup();
    }
}
