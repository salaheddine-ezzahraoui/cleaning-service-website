document.addEventListener('DOMContentLoaded', function() {
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var navbar = document.querySelector('.navbar');

    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', function() {
            navbar.classList.toggle('open');
            var icon = menuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    var navLinks = document.querySelectorAll('.navbar ul li a');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (navbar && navbar.classList.contains('open')) {
                navbar.classList.remove('open');
                var icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });

    var dateInput = document.getElementById('date');
    if (dateInput) {
        var today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = today;
    }

    var timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.value = '09:00';
    }

    var urlParams = new URLSearchParams(window.location.search);
    var serviceParam = urlParams.get('service');
    if (serviceParam) {
        var serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            for (var i = 0; i < serviceSelect.options.length; i++) {
                if (serviceSelect.options[i].value === serviceParam) {
                    serviceSelect.options[i].selected = true;
                    break;
                }
            }
        }
    }

    var bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var fullName = document.getElementById('fullName').value;
            var phone = document.getElementById('phone').value;
            var address = document.getElementById('address').value;
            var date = document.getElementById('date').value;
            var time = document.getElementById('time').value;
            var serviceType = document.getElementById('serviceType').value;
            var terms = document.getElementById('terms').checked;

            if (!fullName || !phone || !address || !date || !time || !serviceType) {
                showFormMessage(bookingForm, 'يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            if (!terms) {
                showFormMessage(bookingForm, 'يرجى الموافقة على الشروط والأحكام', 'error');
                return;
            }

            var submitBtn = bookingForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';
            }

            fetch(API_URL + '/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: fullName, phone: phone, address: address, date: date, time: time, serviceType: serviceType })
            })
            .then(function(resp) {
                if (!resp.ok) throw new Error('Erreur réseau');
                return resp.json();
            })
            .then(function() {
                var responseDiv = document.getElementById('formResponse') || bookingForm.querySelector('.form-response');
                if (responseDiv) {
                    responseDiv.className = 'form-response success';
                    responseDiv.innerHTML = [
                        '<i class="fas fa-check-circle"></i>',
                        '<h3>تم إرسال طلب الحجز بنجاح!</h3>',
                        '<p>سيتم الاتصال بك قريباً لتأكيد الحجز</p>',
                        '<div class="booking-summary">',
                            '<p><strong>الخدمة:</strong> ' + getServiceName(serviceType) + '</p>',
                            '<p><strong>التاريخ:</strong> ' + date + '</p>',
                            '<p><strong>الوقت:</strong> ' + time + '</p>',
                        '</div>'
                    ].join('');
                    responseDiv.style.display = 'block';
                }
                bookingForm.reset();
                if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                if (timeInput) timeInput.value = '09:00';
            })
            .catch(function() {
                showFormMessage(bookingForm, 'حدث خطأ في الإرسال. حاول مرة أخرى.', 'error');
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'تأكيد الحجز';
                }
            });
        });
    }

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = document.getElementById('name').value;
            var email = document.getElementById('email').value;
            var phone = document.getElementById('phone').value;
            var subject = document.getElementById('subject').value;
            var message = document.getElementById('message').value;

            if (!name || !email || !phone || !subject || !message) {
                showFormMessage(contactForm, 'يرجى ملء جميع الحقول', 'error');
                return;
            }

            var submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';
            }

            fetch(API_URL + '/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, phone: phone, subject: subject, message: message })
            })
            .then(function(resp) {
                if (!resp.ok) throw new Error('Erreur réseau');
                return resp.json();
            })
            .then(function() {
                var responseDiv = document.getElementById('formResponse') || contactForm.querySelector('.form-response');
                if (responseDiv) {
                    responseDiv.className = 'form-response success';
                    responseDiv.innerHTML = [
                        '<i class="fas fa-check-circle"></i>',
                        '<h3>تم إرسال رسالتك بنجاح!</h3>',
                        '<p>سنرد عليك في أقرب وقت ممكن. شكراً لتواصلك معنا.</p>'
                    ].join('');
                    responseDiv.style.display = 'block';
                }
                contactForm.reset();
            })
            .catch(function() {
                showFormMessage(contactForm, 'حدث خطأ في الإرسال. حاول مرة أخرى.', 'error');
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'إرسال الرسالة';
                }
            });
        });
    }

    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tab = this.dataset.tab;
            tabBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            var panes = document.querySelectorAll('.tab-pane');
            panes.forEach(function(p) { p.classList.remove('active'); });
            var target = document.getElementById(tab + '-tab');
            if (target) target.classList.add('active');
        });
    });
});

function toggleFAQ(element) {
    var item = element.parentElement;
    var isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('active'); });
    if (!isActive) {
        item.classList.add('active');
    }
}

function showFormMessage(form, message, type) {
    var responseDiv = form.querySelector('.form-response');
    if (!responseDiv) {
        responseDiv = document.createElement('div');
        responseDiv.className = 'form-response';
        form.appendChild(responseDiv);
    }
    responseDiv.className = 'form-response ' + type;
    responseDiv.textContent = message;
    responseDiv.style.display = 'block';
    setTimeout(function() {
        responseDiv.style.display = 'none';
    }, 5000);
}

function getServiceName(value) {
    var names = {
        'daily': 'التنظيف اليومي',
        'deep': 'التنظيف العميق',
        'move-in-out': 'تنظيف الدخول والخروج',
        'commercial': 'تنظيف المكاتب',
        'special': 'خدمة خاصة'
    };
    return names[value] || value;
}
