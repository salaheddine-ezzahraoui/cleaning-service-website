var API_URL = 'http://localhost:5000';

(function() {
    var token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    var email = sessionStorage.getItem('adminEmail');
    var name = sessionStorage.getItem('adminName');
    var nameEl = document.getElementById('adminNameDisplay');
    var emailEl = document.getElementById('adminEmailDisplay');
    if (name && nameEl) nameEl.textContent = name;
    if (email && emailEl) emailEl.textContent = email;

    fetch(API_URL + '/api/auth/verify', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(resp) {
        if (!resp.ok) {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminEmail');
            window.location.href = 'index.html';
        }
    })
    .catch(function() {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminEmail');
        window.location.href = 'index.html';
    });
})();

function adminLogout() {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminEmail');
    window.location.href = 'index.html';
}

function getToken() {
    return sessionStorage.getItem('adminToken');
}

function apiFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + getToken();
    options.headers['Content-Type'] = 'application/json';
    return fetch(API_URL + url, options).then(function(resp) {
        if (resp.status === 401) {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminEmail');
            window.location.href = 'index.html';
            throw new Error('Session expirée');
        }
        return resp.json();
    });
}

function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function refresh() {
    var container = document.getElementById('adminData');
    if (!container) return;
    var filter = document.getElementById('filterType')?.value || 'all';

    var allData = [];

    Promise.all([
        apiFetch('/api/bookings').then(function(data) {
            data.forEach(function(r) { r._type = 'booking'; });
            return data;
        }).catch(function() { return []; }),
        apiFetch('/api/contacts').then(function(data) {
            data.forEach(function(r) { r._type = 'contact'; });
            return data;
        }).catch(function() { return []; }),
        apiFetch('/api/stats').catch(function() { return { total: 0, bookings: 0, contacts: 0 }; })
    ])
    .then(function(results) {
        var bookings = results[0];
        var contacts = results[1];
        var stats = results[2];

        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('bookingCount').textContent = stats.bookings;
        document.getElementById('contactCount').textContent = stats.contacts;

        allData = bookings.map(function(r) { return { id: r.id, type: 'booking', fullName: r.full_name, phone: r.phone, serviceType: r.service_type, createdAt: r.created_at }; })
            .concat(contacts.map(function(r) { return { id: r.id, type: 'contact', name: r.name, phone: r.phone, subject: r.subject, createdAt: r.created_at }; }));

        allData.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

        var filtered = filter === 'all' ? allData : allData.filter(function(r) { return r.type === filter; });

        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="empty">لا توجد بيانات بعد</td></tr>';
            document.getElementById('recordCount').textContent = '';
            return;
        }

        container.innerHTML = filtered.map(function(r) {
            var isBooking = r.type === 'booking';
            var label = isBooking ? r.serviceType : r.subject;
            var date = new Date(r.createdAt).toLocaleDateString('ar-MA');
            var badge = isBooking
                ? '<span class="badge badge-booking">حجز</span>'
                : '<span class="badge badge-contact">رسالة</span>';
            return '<tr>' +
                '<td>' + date + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' + escapeHTML(isBooking ? r.fullName : r.name) + '</td>' +
                '<td dir="ltr" style="text-align:right">' + escapeHTML(r.phone) + '</td>' +
                '<td>' + escapeHTML(label) + '</td>' +
                '<td>' +
                    '<button onclick="viewRecord(' + r.id + ',\'' + r.type + '\')" class="btn-sm btn-view"><i class="fas fa-eye"></i></button>' +
                    '<button onclick="deleteRecord(' + r.id + ',\'' + r.type + '\')" class="btn-sm btn-delete"><i class="fas fa-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
        document.getElementById('recordCount').textContent = '(' + filtered.length + ' سجل)';
    })
    .catch(function() {
        container.innerHTML = '<tr><td colspan="6" class="empty">خطأ في تحميل البيانات</td></tr>';
    });
}

function viewRecord(id, type) {
    apiFetch('/api/' + type + 's').then(function(all) {
        var r = all.find(function(d) { return d.id === id; });
        if (!r) return;

        var labels = {
            id: 'الرقم', full_name: 'الاسم', name: 'الاسم', phone: 'الهاتف', email: 'البريد',
            address: 'العنوان', date: 'التاريخ', time: 'الوقت', service_type: 'الخدمة',
            subject: 'الموضوع', message: 'الرسالة', created_at: 'تاريخ التسجيل'
        };

        var serviceNames = {
            'daily': 'التنظيف اليومي', 'deep': 'التنظيف العميق',
            'move-in-out': 'تنظيف دخول/خروج', 'commercial': 'تنظيف مكاتب',
            'special': 'خدمة خاصة'
        };

        var html = '<table class="detail-table">';
        for (var key in r) {
            if (key === 'id') continue;
            var val = r[key];
            var label = labels[key] || key;
            if (key === 'service_type') val = serviceNames[val] || val;
            if (key === 'created_at') val = new Date(val).toLocaleString('ar-MA');
            html += '<tr><td>' + label + '</td><td>' + escapeHTML(String(val)) + '</td></tr>';
        }
        html += '</table>';

        document.getElementById('viewContent').innerHTML = html;
        document.getElementById('viewModal').style.display = 'flex';
    });
}

function deleteRecord(id, type) {
    if (!confirm('تأكيد حذف هذا السجل؟')) return;
    apiFetch('/api/records/' + id, { method: 'DELETE' }).then(function() {
        refresh();
    });
}

function clearDB() {
    if (!confirm('مسح جميع البيانات؟')) return;
    apiFetch('/api/records', { method: 'DELETE' }).then(function() {
        refresh();
    });
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function showSection(section) {
    var sel = document.getElementById('filterType');
    if (sel) { sel.value = section; }
    refresh();
    document.querySelectorAll('.sidebar-nav a').forEach(function(a) { a.classList.remove('active'); });
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', refresh);
