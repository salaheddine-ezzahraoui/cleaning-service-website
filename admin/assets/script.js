// Auth check
(function() {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
        window.location.href = 'index.html';
    }
})();

function adminLogout() {
    sessionStorage.removeItem('adminAuth');
    window.location.href = 'index.html';
}

// Database functions (shared with main site)
function getDB() {
    try {
        return JSON.parse(localStorage.getItem('cleaningServiceDB')) || [];
    } catch { return []; }
}

function saveToDB(record) {
    const db = getDB();
    db.unshift(record);
    localStorage.setItem('cleaningServiceDB', JSON.stringify(db));
}

function deleteFromDB(id) {
    let db = getDB().filter(r => r.id !== id);
    localStorage.setItem('cleaningServiceDB', JSON.stringify(db));
    return db;
}

function clearDB() {
    localStorage.removeItem('cleaningServiceDB');
}

function refresh() {
    const container = document.getElementById('adminData');
    if (!container) return;
    const filter = document.getElementById('filterType')?.value || 'all';
    const db = getDB();
    let filtered = filter === 'all' ? db : db.filter(r => r.type === filter);

    document.getElementById('totalCount').textContent = db.length;
    document.getElementById('bookingCount').textContent = db.filter(r => r.type === 'booking').length;
    document.getElementById('contactCount').textContent = db.filter(r => r.type === 'contact').length;

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="empty">لا توجد بيانات بعد</td></tr>';
        document.getElementById('recordCount').textContent = '';
        return;
    }

    container.innerHTML = filtered.map(r => {
        const isBooking = r.type === 'booking';
        const label = isBooking ? r.serviceType : r.subject;
        const date = new Date(r.createdAt).toLocaleDateString('ar-MA');
        const badge = isBooking
            ? '<span class="badge badge-booking">حجز</span>'
            : '<span class="badge badge-contact">رسالة</span>';
        return `<tr>
            <td>${date}</td>
            <td>${badge}</td>
            <td>${isBooking ? r.fullName : r.name}</td>
            <td dir="ltr" style="text-align:right">${r.phone}</td>
            <td>${label}</td>
            <td>
                <button onclick="viewRecord(${r.id})" class="btn-sm btn-view"><i class="fas fa-eye"></i></button>
                <button onclick="if(confirm('تأكيد حذف هذا السجل؟')){deleteFromDB(${r.id});refresh();}" class="btn-sm btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
    document.getElementById('recordCount').textContent = `(${filtered.length} سجل)`;
}

function viewRecord(id) {
    const db = getDB();
    const r = db.find(d => d.id === id);
    if (!r) return;
    const labels = {
        type:'النوع', fullName:'الاسم', name:'الاسم', phone:'الهاتف', email:'البريد',
        address:'العنوان', date:'التاريخ', time:'الوقت', serviceType:'الخدمة',
        subject:'الموضوع', message:'الرسالة', specialRequests:'طلبات خاصة',
        frequency:'التكرار', createdAt:'تاريخ التسجيل'
    };
    let html = '<table class="detail-table">';
    for (const [k,v] of Object.entries(r)) {
        if (k==='id') continue;
        if (k==='type') { html += `<tr><td>${labels[k]||k}</td><td>${v==='booking'?'حجز خدمة':'رسالة'}</td></tr>`; continue; }
        let val = v;
        if (k==='serviceType') {
            const names={daily:'التنظيف اليومي',deep:'التنظيف العميق','move-in-out':'تنظيف دخول/خروج',commercial:'تنظيف مكاتب',special:'خدمة خاصة'};
            val = names[v]||v;
        }
        if (k==='frequency') {
            const freqs={once:'مرة واحدة',weekly:'أسبوعياً',biweekly:'كل أسبوعين',monthly:'شهرياً',custom:'مخصص'};
            val = freqs[v]||v;
        }
        if (k==='createdAt') { val = new Date(v).toLocaleString('ar-MA'); }
        html += `<tr><td>${labels[k]||k}</td><td>${val}</td></tr>`;
    }
    html += '</table>';
    document.getElementById('viewContent').innerHTML = html;
    document.getElementById('viewModal').style.display = 'flex';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function showSection(section) {
    const sel = document.getElementById('filterType');
    if (sel) { sel.value = section; }
    refresh();
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', refresh);