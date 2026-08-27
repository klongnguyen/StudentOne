const API_URL = '/api/students';

let languageChartInstance = null;

const app = {
    students: [],
    isEditMode: false,
    
    init: function() {
        this.loadStudents();
        this.setupSearch();
        this.loadStats();
    },

    switchTab: function(tabName) {
        // Remove active class from nav items
        document.getElementById('nav-students').classList.remove('active');
        document.getElementById('nav-dashboard').classList.remove('active');
        
        // Hide all views
        document.getElementById('studentsView').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'none';
        
        // Activate selected tab
        if (tabName === 'students') {
            document.getElementById('nav-students').classList.add('active');
            document.getElementById('studentsView').style.display = 'block';
        } else if (tabName === 'dashboard') {
            document.getElementById('nav-dashboard').classList.add('active');
            document.getElementById('dashboardView').style.display = 'block';
            this.loadStats(); // Reload charts to fix resize issues when changing display
        }
    },

    // ----------------------------------------------------
    // Lấy dữ liệu và vẽ bảng
    // ----------------------------------------------------
    loadStudents: async function(malop = '') {
        try {
            const url = malop ? `${API_URL}?malop=${malop}` : API_URL;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch students');
            this.students = await res.json();
            this.renderTable();
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ API.', 'error');
            console.error(error);
        }
    },

    renderTable: function() {
        const tbody = document.querySelector('#studentTable tbody');
        tbody.innerHTML = '';
        
        this.students.forEach(s => {
            let totalCredits = 0;
            if (s.monHoc) {
                totalCredits = s.monHoc
                    .filter(m => m.danhGia === 'Đạt' || m.DanhGia === 'Đạt')
                    .reduce((sum, m) => sum + (m.stc || m.STC || 0), 0);
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.maSV}</strong></td>
                <td>${s.hoTen}</td>
                <td><span class="badge secondary">${s.maLop}</span></td>
                <td>${s.phai || ''}</td>
                <td>
                    <span class="badge">${totalCredits} Tín chỉ</span>
                </td>
                <td>
                    <button class="btn-icon" onclick="app.editStudent('${s.maSV}')" title="Sửa / Chi tiết">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon delete" onclick="app.deleteStudent('${s.maSV}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    setupSearch: function() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            // Basic frontend filter based on maLop, or we could call backend
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#studentTable tbody tr');
            rows.forEach(row => {
                const malop = row.querySelector('td:nth-child(3)').innerText.toLowerCase();
                if (malop.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    },

    // ----------------------------------------------------
    // Modal Form Logic
    // ----------------------------------------------------
    openForm: function() {
        this.isEditMode = false;
        document.getElementById('modalTitle').innerText = 'Thêm Sinh viên mới';
        document.getElementById('studentForm').reset();
        document.getElementById('masv').readOnly = false;
        
        document.getElementById('languagesContainer').innerHTML = '';
        document.getElementById('subjectsContainer').innerHTML = '';
        
        document.getElementById('studentModal').classList.add('active');
    },

    closeForm: function() {
        document.getElementById('studentModal').classList.remove('active');
    },

    editStudent: function(masv) {
        this.isEditMode = true;
        const student = this.students.find(s => s.maSV === masv);
        if (!student) return;

        document.getElementById('modalTitle').innerText = `Chỉnh sửa sinh viên: ${student.hoTen}`;
        document.getElementById('masv').value = student.maSV;
        document.getElementById('masv').readOnly = true; // Không cho sửa mã SV
        document.getElementById('hoten').value = student.hoTen;
        document.getElementById('malop').value = student.maLop;
        document.getElementById('phai').value = student.phai || 'Nam';
        document.getElementById('tuoi').value = student.tuoi || '';
        document.getElementById('khoa').value = student.khoa || '';
        document.getElementById('namhoc').value = student.namHoc || '';
        document.getElementById('email').value = student.email || student.Email || '';
        document.getElementById('sdt').value = student.sdt || student.SDT || '';

        // Render languages
        const langContainer = document.getElementById('languagesContainer');
        langContainer.innerHTML = '';
        if (student.ngoaiNgu) {
            student.ngoaiNgu.forEach(lang => {
                this.addLanguageRow(lang);
            });
        }

        // Render subjects
        const subContainer = document.getElementById('subjectsContainer');
        subContainer.innerHTML = '';
        if (student.monHoc) {
            student.monHoc.forEach(sub => {
                this.addSubjectRow(sub);
            });
        }

        document.getElementById('studentModal').classList.add('active');
    },

    addLanguageRow: function(data = {}) {
        const container = document.getElementById('languagesContainer');
        const div = document.createElement('div');
        div.className = 'dynamic-row lang-row';
        div.innerHTML = `
            <div class="row-top">
                <div class="form-group">
                    <label>Ngoại ngữ</label>
                    <input type="text" class="l-ten" value="${data.tenNgoaiNgu || ''}" required>
                </div>
                <div class="form-group">
                    <label>Trình độ</label>
                    <input type="text" class="l-trinhdo" value="${data.trinhDo || ''}" required>
                </div>
                <div class="form-group">
                    <label>Chứng chỉ (Link)</label>
                    <input type="text" class="l-link" value="${data.certLink || ''}">
                </div>
                <button type="button" class="btn-icon delete" onclick="this.closest('.dynamic-row').remove()">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="row-bottom form-group">
                <label>Ghi chú</label>
                <input type="text" class="l-ghichu" value="${data.ghiChu || ''}">
            </div>
        `;
        container.appendChild(div);
    },

    addSubjectRow: function(data = {}) {
        const container = document.getElementById('subjectsContainer');
        const div = document.createElement('div');
        div.className = 'dynamic-row subject-row';
        
        let badgeHtml = '';
        const danhGia = data.danhGia || data.DanhGia;
        if (danhGia) {
            const badgeClass = danhGia === 'Đạt' ? 'badge-dat' : 'badge-khongdat';
            badgeHtml = `<span class="badge-danhgia ${badgeClass}">${danhGia}</span>`;
        }
        
        div.innerHTML = `
            <div class="form-group">
                <label>Mã môn</label>
                <input type="text" class="s-ma" value="${data.maMon || ''}" required>
            </div>
            <div class="form-group">
                <label>Tên môn</label>
                <input type="text" class="s-ten" value="${data.tenMon || ''}" required>
            </div>
            <div class="form-group">
                <label>Số TC</label>
                <input type="number" min="1" class="s-stc" value="${data.stc !== undefined ? data.stc : data.STC || ''}" required>
            </div>
            <div class="form-group">
                <label>Điểm ${badgeHtml}</label>
                <input type="number" step="0.1" min="0" max="10" class="s-diem" value="${data.diem !== undefined ? data.diem : ''}" required>
            </div>
            <button type="button" class="btn-icon delete" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    },

    // ----------------------------------------------------
    // Lưu và Xóa
    // ----------------------------------------------------
    saveStudent: async function() {
        // Thu thập dữ liệu từ Form
        const maSV = document.getElementById('masv').value.trim();
        const hoTen = document.getElementById('hoten').value.trim();
        const maLop = document.getElementById('malop').value.trim();
        
        if (!maSV || !hoTen || !maLop) {
            Swal.fire('Thiếu thông tin', 'Vui lòng nhập Mã SV, Họ Tên và Lớp.', 'warning');
            return;
        }

        const dto = {
            maSV: maSV,
            hoTen: hoTen,
            maLop: maLop,
            phai: document.getElementById('phai').value,
            tuoi: parseInt(document.getElementById('tuoi').value) || 0,
            khoa: document.getElementById('khoa').value.trim(),
            namHoc: document.getElementById('namhoc').value.trim(),
            email: document.getElementById('email').value.trim(),
            sdt: document.getElementById('sdt').value.trim(),
            ngoaiNgu: [],
            monHoc: []
        };

        // Thu thập mảng Ngoại ngữ
        document.querySelectorAll('.lang-row').forEach(row => {
            dto.ngoaiNgu.push({
                tenNgoaiNgu: row.querySelector('.l-ten').value.trim(),
                trinhDo: row.querySelector('.l-trinhdo').value.trim(),
                certLink: row.querySelector('.l-link').value.trim(),
                ghiChu: row.querySelector('.l-ghichu').value.trim()
            });
        });

        // Thu thập mảng Môn học
        document.querySelectorAll('.subject-row').forEach(row => {
            dto.monHoc.push({
                maMon: row.querySelector('.s-ma').value.trim(),
                tenMon: row.querySelector('.s-ten').value.trim(),
                stc: parseInt(row.querySelector('.s-stc').value) || 0,
                diem: parseFloat(row.querySelector('.s-diem').value) || 0
            });
        });

        try {
            let res;
            if (this.isEditMode) {
                // Backend của chúng ta dùng Replace endpoint để update toàn bộ object (bao gồm mảng)
                res = await fetch(`${API_URL}/${maSV}/replace`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dto)
                });
            } else {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dto)
                });
            }

            if (res.ok) {
                Swal.fire('Thành công', 'Đã lưu thông tin sinh viên.', 'success');
                this.closeForm();
                this.loadStudents();
                this.loadStats();
            } else {
                const errText = await res.text();
                Swal.fire('Lỗi', errText || 'Đã xảy ra lỗi', 'error');
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối API', 'error');
        }
    },

    deleteStudent: function(masv) {
        Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: `Bạn sắp xóa sinh viên mã ${masv}. Hành động này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_URL}/${masv}`, { method: 'DELETE' });
                    if (res.ok) {
                        Swal.fire('Đã xóa!', `Sinh viên ${masv} đã bị xóa khỏi cơ sở dữ liệu.`, 'success');
                        this.loadStudents();
                        this.loadStats();
                    } else {
                        const err = await res.text();
                        Swal.fire('Lỗi', err, 'error');
                    }
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể kết nối API', 'error');
                }
            }
        });
    },

    loadStats: function() {
        // 1. KPI Cards
        fetch(API_URL + '/stats/kpi')
            .then(r => r.json())
            .then(data => {
                document.getElementById('kpi-total-students').innerText = data.totalStudents;
                document.getElementById('kpi-total-classes').innerText = data.totalClasses;
                document.getElementById('kpi-avg-gpa').innerText = data.averageGpa.toFixed(2);
                document.getElementById('kpi-gender-ratio').innerText = `${data.malePercentage}% / ${data.femalePercentage}%`;
            });

        // 2. Class Stats Table
        fetch(API_URL + '/stats/by-class')
            .then(r => r.json())
            .then(data => {
                const tbody = document.querySelector('#classStatsTable tbody');
                tbody.innerHTML = '';
                data.forEach(d => {
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${d.maLop}</strong></td>
                            <td>${d.totalStudents}</td>
                            <td><span class="badge secondary">${d.maxGpa.toFixed(2)}</span></td>
                            <td><span class="badge" style="background:#fee2e2;color:#dc2626">${d.minGpa.toFixed(2)}</span></td>
                        </tr>
                    `;
                });
            });

        // 3. Top 5 GPA Table
        fetch(API_URL + '/stats/gpa')
            .then(r => r.json())
            .then(data => {
                const tbody = document.querySelector('#topGpaTable tbody');
                tbody.innerHTML = '';
                const top5 = data.slice(0, 5);
                top5.forEach(d => {
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${d.maSV}</strong></td>
                            <td>${d.hoTen}</td>
                            <td><span class="badge-danhgia badge-dat">${d.gpa.toFixed(2)}</span></td>
                        </tr>
                    `;
                });
            });

        // 4. Academic Classifications Table
        fetch(API_URL + '/stats/classifications')
            .then(r => r.json())
            .then(data => {
                const tbody = document.querySelector('#classificationTable tbody');
                tbody.innerHTML = '';
                data.forEach(d => {
                    let badgeClass = 'secondary';
                    if (d.classification === 'Xuất sắc') badgeClass = 'badge-dat';
                    else if (d.classification === 'Giỏi') badgeClass = 'badge-dat';
                    else if (d.classification === 'Khá') badgeClass = 'secondary';
                    else badgeClass = 'badge-khongdat';

                    tbody.innerHTML += `
                        <tr>
                            <td><span class="badge ${badgeClass}" style="font-size: 0.9rem">${d.classification}</span></td>
                            <td><strong>${d.count}</strong> Sinh viên</td>
                        </tr>
                    `;
                });
            });

        // 5. Language Popularity Histogram
        fetch(API_URL + '/stats/languages')
            .then(r => r.json())
            .then(data => {
                const ctx = document.getElementById('languageChart');
                if (languageChartInstance) languageChartInstance.destroy();

                languageChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.language),
                        datasets: [{
                            label: 'Số lượng Sinh viên',
                            data: data.map(d => d.count),
                            backgroundColor: '#8b5cf6'
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            });
    }
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
