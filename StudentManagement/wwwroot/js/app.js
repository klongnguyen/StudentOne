const API_URL = '/api/students';

const app = {
    students: [],
    isEditMode: false,
    
    init: function() {
        this.loadStudents();
        this.setupSearch();
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
                    } else {
                        const err = await res.text();
                        Swal.fire('Lỗi', err, 'error');
                    }
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể kết nối API', 'error');
                }
            }
        });
    }
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
