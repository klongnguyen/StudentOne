const API_URL = '/api/students';

let languageChartInstance = null;
let classificationChartInstance = null;

const app = {
    allStudents: [],
    students: [],
    uniqueSubjects: [],
    uniqueLanguages: [],
    isEditMode: false,
    currentSortCol: '',
    isAscending: true,
    currentPage: 1,
    pageSize: 25,
    
    init: function() {
        this.loadSettings();
        this.loadStudents();
        this.setupSearch();
        this.loadStats();
        this.loadUniqueSubjects();
        this.loadUniqueLanguages();
    },

    switchTab: function(tabName) {
        // Remove active class from nav items
        const navStudents = document.getElementById('nav-students');
        const navDashboard = document.getElementById('nav-dashboard');
        const navSettings = document.getElementById('nav-settings');
        
        if (navStudents) navStudents.classList.remove('active');
        if (navDashboard) navDashboard.classList.remove('active');
        if (navSettings) navSettings.classList.remove('active');
        
        // Hide all views
        document.getElementById('studentsView').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('settingsView').style.display = 'none';
        
        // Activate selected tab
        if (tabName === 'students') {
            if (navStudents) navStudents.classList.add('active');
            document.getElementById('studentsView').style.display = 'block';
        } else if (tabName === 'dashboard') {
            if (navDashboard) navDashboard.classList.add('active');
            document.getElementById('dashboardView').style.display = 'block';
            this.loadStats(); // Reload charts to fix resize issues when changing display
        } else if (tabName === 'settings') {
            if (navSettings) navSettings.classList.add('active');
            document.getElementById('settingsView').style.display = 'block';
        }
    },

    // ----------------------------------------------------
    // Lấy dữ liệu và vẽ bảng
    // ----------------------------------------------------
    loadUniqueSubjects: async function() {
        try {
            const res = await fetch(`${API_URL}/subjects`);
            if (!res.ok) throw new Error('Failed to fetch subjects');
            this.uniqueSubjects = await res.json();
            
            const dataList = document.getElementById('subjectList');
            if (dataList) {
                dataList.innerHTML = '';
                this.uniqueSubjects.forEach(sub => {
                    dataList.innerHTML += `<option value="${sub.maMon}">${sub.tenMon}</option>`;
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách môn học:', error);
        }
    },

    loadUniqueLanguages: async function() {
        try {
            const res = await fetch(`${API_URL}/languages`);
            if (!res.ok) throw new Error('Failed to fetch languages');
            this.uniqueLanguages = await res.json();
            
            const dataList = document.getElementById('languageList');
            if (dataList) {
                dataList.innerHTML = '';
                this.uniqueLanguages.forEach(lang => {
                    dataList.innerHTML += `<option value="${lang}">${lang}</option>`;
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách ngoại ngữ:', error);
        }
    },

    loadStudents: async function(malop = '') {
        try {
            const url = malop ? `${API_URL}?malop=${malop}` : API_URL;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            
            const classSet = new Set();
            
            // Calculate total credits for sorting
            this.allStudents = data.map(s => {
                if (s.maLop) classSet.add(s.maLop);
                let tc = 0;
                if (s.monHoc) {
                    tc = s.monHoc
                        .filter(m => m.danhGia === 'Đạt' || m.DanhGia === 'Đạt')
                        .reduce((sum, m) => sum + (m.stc || m.STC || 0), 0);
                }
                s.totalCredits = tc;
                return s;
            });
            this.students = [...this.allStudents];
            
            // Populate Class Filter
            const classSelect = document.getElementById('filterClass');
            const currentSelectedClass = classSelect.value;
            classSelect.innerHTML = '<option value="all">Tất cả Lớp</option>';
            Array.from(classSet).sort().forEach(c => {
                classSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });
            // Giữ nguyên lựa chọn cũ nếu có
            if (Array.from(classSelect.options).some(o => o.value === currentSelectedClass)) {
                classSelect.value = currentSelectedClass;
            }
            
            // Setup custom autocomplete cho form thêm/sửa Lớp
            const sortedClasses = Array.from(classSet).sort();
            const malopInput = document.getElementById('malop');
            const classListDropdown = document.getElementById('classListDropdown');
            if (malopInput && classListDropdown) {
                app.setupCustomAutocomplete(malopInput, classListDropdown, sortedClasses);
            }
            
            this.applyFilterAndSort();
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ API.', 'error');
            console.error(error);
        }
    },

    renderTable: function() {
        const tbody = document.querySelector('#studentTable tbody');
        tbody.innerHTML = '';
        
        // Paging logic
        const totalItems = this.students.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, totalItems);
        const pageData = this.students.slice(startIndex, endIndex);

        pageData.forEach(s => {
            const totalCredits = s.totalCredits || 0;
            
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

        // Update Pagination UI
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            if (totalItems === 0) {
                pageInfo.innerText = 'Không tìm thấy sinh viên nào';
            } else {
                pageInfo.innerText = `Đang hiển thị ${startIndex + 1} đến ${endIndex} trong số ${totalItems} sinh viên`;
            }
        }
        const pageNumbers = document.getElementById('pageNumbers');
        if (pageNumbers) {
            pageNumbers.innerText = `Trang ${this.currentPage} / ${totalPages > 0 ? totalPages : 1}`;
        }
    },

    prevPage: function() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    },
    
    nextPage: function() {
        const totalPages = Math.ceil(this.students.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    },

    setupSearch: function() {
        const searchInput = document.getElementById('searchInput');
        
        // Listen for Enter key on search input
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.applyFilterAndSort();
            }
        });
        
        // Keep class filter real-time or maybe just let button do it. 
        // We'll let button and select trigger it.
        document.getElementById('filterClass').addEventListener('change', () => this.applyFilterAndSort());
    },

    extractNameParts: function(fullName) {
        if (!fullName) return { firstName: '', lastName: '' };
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return { firstName: parts[0], lastName: '' };
        const firstName = parts.pop();
        const lastName = parts.join(' ');
        return { firstName, lastName };
    },

    parseClass: function(maLop) {
        if (!maLop) return { cohort: 0, subject: '', num: 0, original: '' };
        const match = maLop.match(/^(\d+)([a-zA-Z]+)(\d+)$/);
        if (match) {
            return {
                cohort: parseInt(match[1]),
                subject: match[2],
                num: parseInt(match[3]),
                original: maLop
            };
        }
        return { cohort: 0, subject: maLop, num: 0, original: maLop };
    },

    sortData: function(column) {
        if (this.currentSortCol === column) {
            this.isAscending = !this.isAscending;
        } else {
            this.currentSortCol = column;
            this.isAscending = true;
        }
        this.applyFilterAndSort();
    },

    applyFilterAndSort: function() {
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        const filterClass = document.getElementById('filterClass').value;
        const btnDeleteClass = document.getElementById('btnDeleteClass');

        if (btnDeleteClass) {
            btnDeleteClass.disabled = (filterClass === 'all');
        }

        // 1. Lọc (Filter)
        this.students = this.allStudents.filter(s => {
            // Lọc theo Lớp (Dropdown)
            if (filterClass !== 'all' && s.maLop !== filterClass) return false;

            // Tìm kiếm tương đối / tuyệt đối theo Mã SV hoặc Tên (Textbox)
            if (searchTerm) {
                const svMasv = (s.maSV || '').toLowerCase();
                const nameParts = this.extractNameParts(s.hoTen);
                const svTen = nameParts.firstName.toLowerCase();
                
                if (!svMasv.includes(searchTerm) && !svTen.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });

        // 2. Sắp xếp (Sort)
        if (this.currentSortCol) {
            this.students.sort((a, b) => {
                const isAsc = this.isAscending ? 1 : -1;
                
                if (this.currentSortCol === 'hoTen') {
                    // Sắp xếp theo Tên (từ cuối cùng), nếu trùng thì xét Họ đệm
                    const nameA = this.extractNameParts(a.hoTen);
                    const nameB = this.extractNameParts(b.hoTen);
                    
                    const cmpTen = nameA.firstName.localeCompare(nameB.firstName);
                    if (cmpTen !== 0) return cmpTen * isAsc;
                    
                    return nameA.lastName.localeCompare(nameB.lastName) * isAsc;
                } 
                else if (this.currentSortCol === 'maLop') {
                    // Sắp xếp theo Khóa -> Ngành -> Số thứ tự (VD: 14DHTH01)
                    const classA = this.parseClass(a.maLop);
                    const classB = this.parseClass(b.maLop);
                    
                    if (classA.cohort !== classB.cohort) return (classA.cohort - classB.cohort) * isAsc;
                    
                    const cmpSubj = classA.subject.localeCompare(classB.subject);
                    if (cmpSubj !== 0) return cmpSubj * isAsc;
                    
                    if (classA.num !== classB.num) return (classA.num - classB.num) * isAsc;
                    
                    return classA.original.localeCompare(classB.original) * isAsc;
                }
                else {
                    // Mặc định cho Mã SV và Tín chỉ
                    let valA = a[this.currentSortCol];
                    let valB = b[this.currentSortCol];

                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();

                    if (valA < valB) return -1 * isAsc;
                    if (valA > valB) return 1 * isAsc;
                    return 0;
                }
            });
        }

        this.currentPage = 1; // Reset to page 1 after filter/sort
        this.renderTable();
    },

    deleteClass: function() {
        const filterClass = document.getElementById('filterClass').value;
        if (filterClass === 'all') return;

        Swal.fire({
            title: `Xác nhận xóa lớp ${filterClass}?`,
            text: `Bạn có chắc chắn muốn xóa TOÀN BỘ sinh viên thuộc lớp ${filterClass} không? Hành động này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Có, Xóa ngay!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_URL}/class/${filterClass}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Delete class failed');
                    
                    const resultData = await res.json();
                    
                    Swal.fire('Đã xóa!', resultData.message || `Đã xóa thành công lớp ${filterClass}.`, 'success');
                    
                    // Xóa thành công, chuyển dropdown về 'all' và load lại
                    document.getElementById('filterClass').value = 'all';
                    this.loadStudents();
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể xóa lớp này.', 'error');
                    console.error(error);
                }
            }
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
        
        const langVal = data.tenNgoaiNgu || '';

        div.innerHTML = `
            <div class="row-top">
                <div class="form-group autocomplete-wrapper">
                    <label>Ngoại ngữ</label>
                    <input type="text" class="l-ten" value="${langVal}" autocomplete="off" required>
                    <ul class="autocomplete-list"></ul>
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

        // Setup custom autocomplete
        const input = div.querySelector('.l-ten');
        const list = div.querySelector('.autocomplete-list');
        app.setupCustomAutocomplete(input, list, app.uniqueLanguages);
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
            <div class="form-group autocomplete-wrapper">
                <label>Mã môn</label>
                <input type="text" class="s-ma" value="${data.maMon || ''}" autocomplete="off" required>
                <ul class="autocomplete-list"></ul>
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
        
        const maInput = div.querySelector('.s-ma');
        const tenInput = div.querySelector('.s-ten');
        const stcInput = div.querySelector('.s-stc');
        const list = div.querySelector('.autocomplete-list');
        
        if (maInput && tenInput && list) {
            app.setupCustomAutocomplete(maInput, list, app.uniqueSubjects, (selectedSubject) => {
                tenInput.value = selectedSubject.tenMon;
                if (stcInput && selectedSubject.stc) {
                    stcInput.value = selectedSubject.stc;
                }
            });
        }
        
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

        // Thu thập mảng Môn học và kiểm tra trùng lặp mã môn
        let hasDuplicateSubject = false;
        const subjectCodes = new Set();

        document.querySelectorAll('.subject-row').forEach(row => {
            const maMon = row.querySelector('.s-ma').value.trim();
            if (maMon) {
                if (subjectCodes.has(maMon)) {
                    hasDuplicateSubject = true;
                }
                subjectCodes.add(maMon);
            }
            
            dto.monHoc.push({
                maMon: maMon,
                tenMon: row.querySelector('.s-ten').value.trim(),
                stc: parseInt(row.querySelector('.s-stc').value) || 0,
                diem: parseFloat(row.querySelector('.s-diem').value) || 0
            });
        });

        if (hasDuplicateSubject) {
            Swal.fire('Lỗi trùng lặp', 'Một sinh viên không thể có 2 môn học trùng mã (Mã môn bị lặp lại).', 'error');
            return;
        }

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

    closeChartModal: function() {
        document.getElementById('chartDetailsModal').classList.remove('active');
    },

    showLanguageDetails: function(language) {
        document.getElementById('chartModalTitle').innerText = `Sinh viên học ngoại ngữ: ${language}`;
        document.getElementById('chartDetailsHeaders').innerHTML = `
            <th>STT</th>
            <th>Mã SV</th>
            <th>Tên SV</th>
            <th>Lớp</th>
            <th>Trình độ</th>
        `;
        const tbody = document.querySelector('#chartDetailsTable tbody');
        tbody.innerHTML = '';
        
        let stt = 1;
        this.allStudents.forEach(s => {
            const langObj = (s.ngoaiNgu || []).find(n => n.tenNgoaiNgu === language);
            if (langObj) {
                const nameParts = this.extractNameParts(s.hoTen);
                tbody.innerHTML += `
                    <tr>
                        <td>${stt++}</td>
                        <td><strong>${s.maSV}</strong></td>
                        <td>${nameParts.firstName}</td>
                        <td><span class="badge secondary">${s.maLop}</span></td>
                        <td><span class="badge">${langObj.trinhDo}</span></td>
                    </tr>
                `;
            }
        });
        document.getElementById('chartDetailsModal').classList.add('active');
    },

    showClassificationDetails: function(classification) {
        document.getElementById('chartModalTitle').innerText = `Sinh viên đạt loại: ${classification}`;
        document.getElementById('chartDetailsHeaders').innerHTML = `
            <th>STT</th>
            <th>Mã SV</th>
            <th>Tên SV</th>
            <th>Lớp</th>
            <th>GPA</th>
        `;
        const tbody = document.querySelector('#chartDetailsTable tbody');
        tbody.innerHTML = '';
        
        let stt = 1;
        this.allStudents.forEach(s => {
            let totalWeighted = 0;
            let totalCredits = 0;
            (s.monHoc || []).forEach(mh => {
                totalWeighted += (mh.diem * mh.stc);
                totalCredits += mh.stc;
            });
            const gpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;
            
            let cls = 'Unknown';
            if (gpa >= 8.5) cls = 'Xuất sắc';
            else if (gpa >= 7.0) cls = 'Giỏi';
            else if (gpa >= 5.5) cls = 'Khá';
            else cls = 'Trung bình/Yếu'; 
            
            if (cls === classification) {
                const nameParts = this.extractNameParts(s.hoTen);
                const badgeClass = gpa >= 5.5 ? 'badge-dat' : 'badge-khongdat';
                tbody.innerHTML += `
                    <tr>
                        <td>${stt++}</td>
                        <td><strong>${s.maSV}</strong></td>
                        <td>${nameParts.firstName}</td>
                        <td><span class="badge secondary">${s.maLop}</span></td>
                        <td><span class="badge-danhgia ${badgeClass}">${gpa.toFixed(2)}</span></td>
                    </tr>
                `;
            }
        });
        document.getElementById('chartDetailsModal').classList.add('active');
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

        // 4. Academic Classifications Chart
        fetch(API_URL + '/stats/classifications')
            .then(r => r.json())
            .then(data => {
                const ctx = document.getElementById('classificationChart');
                if (classificationChartInstance) classificationChartInstance.destroy();

                classificationChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.classification),
                        datasets: [{
                            label: 'Số lượng Sinh viên',
                            data: data.map(d => d.count),
                            backgroundColor: [
                                '#ef4444', // Trung bình/Yếu
                                '#f59e0b', // Khá
                                '#10b981', // Giỏi
                                '#3b82f6'  // Xuất sắc
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const classification = data[index].classification;
                                app.showClassificationDetails(classification);
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
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
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const language = data[index].language;
                                app.showLanguageDetails(language);
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            });
    },

    setupCustomAutocomplete: function(input, list, dataArray, onSelectCallback = null) {
        let currentFocus = -1;

        const renderList = (filterText) => {
            list.innerHTML = '';
            let count = 0;
            const filterLower = filterText.toLowerCase();

            for (let i = 0; i < dataArray.length; i++) {
                const item = dataArray[i];
                const text = typeof item === 'string' ? item : item.maMon; // Handle language strings and subject objects

                if (!filterText || text.toLowerCase().includes(filterLower)) {
                    const li = document.createElement('li');
                    li.textContent = text;
                    li.addEventListener('click', function(e) {
                        e.stopPropagation(); // prevent document click from firing immediately
                        input.value = text;
                        list.style.display = 'none';
                        if (onSelectCallback) onSelectCallback(item);
                    });
                    list.appendChild(li);
                    count++;
                }
            }
            if (count > 0) {
                list.style.display = 'block';
            } else {
                list.style.display = 'none';
            }
        };

        input.addEventListener('input', function() {
            currentFocus = -1;
            renderList(this.value);
        });

        input.addEventListener('focus', function() {
            renderList(this.value);
        });

        input.addEventListener('keydown', function(e) {
            let items = list.getElementsByTagName('li');
            if (e.keyCode == 40) { // DOWN
                currentFocus++;
                addActive(items);
            } else if (e.keyCode == 38) { // UP
                currentFocus--;
                addActive(items);
            } else if (e.keyCode == 13) { // ENTER
                e.preventDefault();
                if (currentFocus > -1 && items.length > 0) {
                    items[currentFocus].click();
                }
            }
        });

        function addActive(items) {
            if (!items || items.length === 0) return;
            removeActive(items);
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (items.length - 1);
            items[currentFocus].style.backgroundColor = '#e2e8f0';
        }

        function removeActive(items) {
            for (let i = 0; i < items.length; i++) {
                items[i].style.backgroundColor = '';
            }
        }

        // Close list when clicking outside
        document.addEventListener('click', function (e) {
            if (!list.parentElement.contains(e.target) && e.target !== input) {
                list.style.display = 'none';
            }
        });
    },

    // ----------------------------------------------------
    // CÀI ĐẶT (SETTINGS)
    // ----------------------------------------------------
    loadSettings: function() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        }

        const primaryColor = localStorage.getItem('primaryColor');
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
    },

    toggleDarkMode: function() {
        const toggle = document.getElementById('darkModeToggle');
        const isDark = toggle ? toggle.checked : false;
        
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    },

    setPrimaryColor: function(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('primaryColor', color);
    },

    // ----------------------------------------------------
    // EXPORT / IMPORT EXCEL
    // ----------------------------------------------------
    exportExcel: function() {
        if (!this.students || this.students.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'info');
            return;
        }

        // Prepare data for Excel
        const data = this.students.map(s => ({
            'Mã SV': s.maSV,
            'Họ Tên': s.hoTen,
            'Lớp': s.maLop,
            'Giới tính': s.phai || '',
            'Tuổi': s.tuoi || '',
            'Khoa': s.khoa || '',
            'Khóa/Năm học': s.namHoc || '',
            'Email': s.email || s.Email || '',
            'SĐT': s.sdt || s.SDT || '',
            'Tổng Tín Chỉ': s.totalCredits || 0
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachSinhVien");

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, "DanhSachSinhVien.xlsx");
    },

    importExcel: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    Swal.fire('Lỗi', 'File Excel không có dữ liệu', 'error');
                    return;
                }

                // Map JSON to Student objects
                const studentsToImport = jsonData.map(row => ({
                    maSV: row['Mã SV'] ? String(row['Mã SV']).trim() : '',
                    hoTen: row['Họ Tên'] ? String(row['Họ Tên']).trim() : '',
                    maLop: row['Lớp'] ? String(row['Lớp']).trim() : '',
                    phai: row['Giới tính'] || 'Nam',
                    tuoi: parseInt(row['Tuổi']) || 20,
                    khoa: row['Khoa'] || '',
                    namHoc: row['Khóa/Năm học'] || '',
                    email: row['Email'] || '',
                    sdt: row['SĐT'] || ''
                })).filter(s => s.maSV && s.hoTen); // Basic validation

                if (studentsToImport.length === 0) {
                    Swal.fire('Lỗi', 'Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại các cột Mã SV, Họ Tên.', 'error');
                    return;
                }

                // Call Bulk API
                const res = await fetch(`${API_URL}/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(studentsToImport)
                });

                if (res.ok) {
                    Swal.fire('Thành công', `Đã import ${studentsToImport.length} sinh viên hợp lệ. Các mã trùng sẽ bị bỏ qua.`, 'success');
                    this.loadStudents();
                } else {
                    const err = await res.text();
                    Swal.fire('Lỗi', err, 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Lỗi', 'Không thể đọc file Excel', 'error');
            } finally {
                // Reset file input so the same file can be selected again
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
