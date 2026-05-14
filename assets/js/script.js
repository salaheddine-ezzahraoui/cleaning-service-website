// =============================================
// نظافة brillante - Cleaning Service Website
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navbar = document.querySelector('.navbar');
    
    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', function() {
            navbar.classList.toggle('open');
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
    
    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.navbar ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navbar && navbar.classList.contains('open')) {
                navbar.classList.remove('open');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });
    
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = today;
    }
    
    // Set default time
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.value = '09:00';
    }
    
    // Get URL parameter for pre-selected service
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            for (let opt of serviceSelect.options) {
                if (opt.value === serviceParam) {
                    opt.selected = true;
                    break;
                }
            }
        }
    }
    
    // Booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const serviceType = document.getElementById('serviceType').value;
            const terms = document.getElementById('terms').checked;
            
            if (!fullName || !phone || !address || !date || !time || !serviceType) {
                showFormMessage(bookingForm, 'يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }
            
            if (!terms) {
                showFormMessage(bookingForm, 'يرجى الموافقة على الشروط والأحكام', 'error');
                return;
            }
            
            // Save to database (localStorage)
            const booking = {
                id: Date.now(),
                type: 'booking',
                fullName, phone, address, date, time,
                serviceType: getServiceName(serviceType),
                createdAt: new Date().toISOString()
            };
            saveToDB(booking);
            
            const responseDiv = document.getElementById('formResponse') || bookingForm.querySelector('.form-response');
            if (responseDiv) {
                responseDiv.className = 'form-response success';
                responseDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h3>تم إرسال طلب الحجز بنجاح!</h3>
                    <p>سيتم الاتصال بك قريباً لتأكيد الحجز</p>
                    <div class="booking-summary">
                        <p><strong>الخدمة:</strong> ${getServiceName(serviceType)}</p>
                        <p><strong>التاريخ:</strong> ${date}</p>
                        <p><strong>الوقت:</strong> ${time}</p>
                    </div>
                `;
                responseDiv.style.display = 'block';
            }
            
            bookingForm.reset();
            if (dateInput) dateInput.value = today;
            if (timeInput) timeInput.value = '09:00';
        });
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !phone || !subject || !message) {
                showFormMessage(contactForm, 'يرجى ملء جميع الحقول', 'error');
                return;
            }
            
            // Save to database (localStorage)
            const contact = {
                id: Date.now(),
                type: 'contact',
                name, email, phone, subject, message,
                createdAt: new Date().toISOString()
            };
            saveToDB(contact);
            
            const responseDiv = document.getElementById('formResponse') || contactForm.querySelector('.form-response');
            if (responseDiv) {
                responseDiv.className = 'form-response success';
                responseDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h3>تم إرسال رسالتك بنجاح!</h3>
                    <p>سنرد عليك في أقرب وقت ممكن. شكراً لتواصلك معنا.</p>
                `;
                responseDiv.style.display = 'block';
            }
            
            contactForm.reset();
        });
    }
    
    // Services tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(p => p.classList.remove('active'));
            
            const target = document.getElementById(tab + '-tab');
            if (target) target.classList.add('active');
        });
    });
});

// Toggle FAQ
function toggleFAQ(element) {
    const item = element.parentElement;
    const isActive = item.classList.contains('active');
    
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    
    if (!isActive) {
        item.classList.add('active');
    }
}

// Show form message
function showFormMessage(form, message, type) {
    let responseDiv = form.querySelector('.form-response');
    if (!responseDiv) {
        responseDiv = document.createElement('div');
        responseDiv.className = 'form-response';
        form.appendChild(responseDiv);
    }
    
    responseDiv.className = 'form-response ' + type;
    responseDiv.textContent = message;
    responseDiv.style.display = 'block';
    
    setTimeout(() => {
        responseDiv.style.display = 'none';
    }, 5000);
}

// Get service name in Arabic
function getServiceName(value) {
    const names = {
        'daily': 'التنظيف اليومي',
        'deep': 'التنظيف العميق',
        'move-in-out': 'تنظيف الدخول والخروج',
        'commercial': 'تنظيف المكاتب',
        'special': 'خدمة خاصة'
    };
    return names[value] || value;
}

// =============================================
// Database (localStorage)
// =============================================
function getDB() {
    try {
        const data = localStorage.getItem('cleaningServiceDB');
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveToDB(record) {
    const db = getDB();
    db.unshift(record);
    localStorage.setItem('cleaningServiceDB', JSON.stringify(db));
}

function deleteFromDB(id) {
    let db = getDB();
    db = db.filter(r => r.id !== id);
    localStorage.setItem('cleaningServiceDB', JSON.stringify(db));
    return db;
}

function clearDB() {
    localStorage.removeItem('cleaningServiceDB');
}

// =============================================
// Admin page loader
// =============================================
function loadAdminData() {
    const container = document.getElementById('adminData');
    if (!container) return;
    
    const filter = document.getElementById('filterType')?.value || 'all';
    const db = getDB();
    let filtered = filter === 'all' ? db : db.filter(r => r.type === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">لا توجد بيانات بعد</td></tr>';
        return;
    }
    
    container.innerHTML = filtered.map(record => {
        const isBooking = record.type === 'booking';
        return `<tr>
            <td>${new Date(record.createdAt).toLocaleDateString('ar-MA')}</td>
            <td>${isBooking ? record.fullName : record.name}</td>
            <td>${record.phone}</td>
            <td>${isBooking ? record.serviceType : record.subject}</td>
            <td>
                <button onclick='viewRecord(${record.id})' class="btn-sm btn-view">عرض</button>
                <button onclick='deleteRecord(${record.id})' class="btn-sm btn-delete">حذف</button>
            </td>
        </tr>`;
    }).join('');
    
    document.getElementById('totalCount').textContent = db.length;
    document.getElementById('bookingCount').textContent = db.filter(r => r.type === 'booking').length;
    document.getElementById('contactCount').textContent = db.filter(r => r.type === 'contact').length;
}

function viewRecord(id) {
    const db = getDB();
    const record = db.find(r => r.id === id);
    if (!record) return;
    
    const modal = document.getElementById('recordModal');
    const content = document.getElementById('recordContent');
    if (!modal || !content) return;
    
    let html = '<table class="detail-table">';
    for (const [key, val] of Object.entries(record)) {
        if (key === 'id' || key === 'createdAt') continue;
        const label = {
            fullName: 'الاسم', name: 'الاسم', phone: 'الهاتف', email: 'البريد',
            address: 'العنوان', date: 'التاريخ', time: 'الوقت',
            serviceType: 'نوع الخدمة', subject: 'الموضوع', message: 'الرسالة',
            type: 'النوع',
            terms: 'الموافقة على الشروط'
        }[key] || key;
        html += `<tr><td><strong>${label}</strong></td><td>${val}</td></tr>`;
    }
    html += '</table>';
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function deleteRecord(id) {
    if (confirm('تأكيد حذف هذا السجل؟')) {
        deleteFromDB(id);
        loadAdminData();
    }
}

function closeModal() {
    const modal = document.getElementById('recordModal');
    if (modal) modal.style.display = 'none';
}

// Close modal on click outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) closeModal();
});

// Add smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});