using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StudentManagement.Models;
using StudentManagement.DTOs;
using StudentManagement.Repositories;
using StudentManagement.Exceptions;

namespace StudentManagement.Services
{
    public class StudentService : IStudentService
    {
        private readonly IStudentRepository _repository;

        public StudentService(IStudentRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Student>> GetAllAsync(string? malop = null)
        {
            return await _repository.GetAllAsync(malop);
        }

        public async Task<Student> GetByMaSVAsync(string masv)
        {
            var student = await _repository.GetByMaSVAsync(masv);
            if (student == null)
            {
                throw new NotFoundException($"Không tìm thấy sinh viên với mã '{masv}'.");
            }
            return student;
        }

        public async Task CreateAsync(StudentCreateDto dto)
        {
            ValidateStudent(dto.MaSV, dto.HoTen, dto.Tuoi, dto.Phai, dto.MaLop, dto.Email, dto.SDT);

            var student = new Student
            {
                MaSV = dto.MaSV,
                HoTen = dto.HoTen,
                Tuoi = dto.Tuoi,
                Phai = dto.Phai,
                NamHoc = dto.NamHoc ?? "",
                Khoa = dto.Khoa ?? "",
                MaLop = dto.MaLop,
                Email = dto.Email ?? "",
                SDT = dto.SDT ?? "",
                NgoaiNgu = new List<Language>(),
                MonHoc = new List<Subject>()
            };

            if (dto.NgoaiNgu != null)
            {
                foreach (var nn in dto.NgoaiNgu)
                {
                    student.NgoaiNgu.Add(new Language
                    {
                        TenNgoaiNgu = nn.TenNgoaiNgu,
                        TrinhDo = nn.TrinhDo,
                        CertLink = nn.CertLink,
                        GhiChu = nn.GhiChu
                    });
                }
            }

            if (dto.MonHoc != null)
            {
                var seenMamon = new HashSet<string>();
                foreach (var mh in dto.MonHoc)
                {
                    if (seenMamon.Contains(mh.MaMon))
                    {
                        throw new DuplicateKeyException($"Môn học '{mh.MaMon}' bị trùng lặp trong dữ liệu gửi lên.");
                    }
                    seenMamon.Add(mh.MaMon);
                    ValidateScore(mh.Diem);
                    if (mh.STC <= 0) throw new ValidationException($"Số tín chỉ của môn '{mh.MaMon}' phải lớn hơn 0.");
                    
                    student.MonHoc.Add(new Subject
                    {
                        MaMon = mh.MaMon,
                        TenMon = mh.TenMon,
                        Diem = mh.Diem,
                        STC = mh.STC,
                        DanhGia = mh.Diem > 4 ? "Đạt" : "Không đạt"
                    });
                }
            }

            await _repository.CreateAsync(student);
        }

        public async Task UpdateBasicAsync(string masv, StudentUpdateDto dto)
        {
            if (dto.Tuoi.HasValue && dto.Tuoi.Value <= 0)
            {
                throw new ValidationException("Tuổi phải lớn hơn 0.");
            }
            if (dto.Phai != null && dto.Phai != "Nam" && dto.Phai != "Nữ")
            {
                throw new ValidationException("Phái chỉ nhận giá trị 'Nam' hoặc 'Nữ'.");
            }
            if (dto.HoTen != null && string.IsNullOrWhiteSpace(dto.HoTen))
            {
                throw new ValidationException("Họ tên không được để trống.");
            }
            if (dto.MaLop != null && string.IsNullOrWhiteSpace(dto.MaLop))
            {
                throw new ValidationException("Mã lớp không được để trống.");
            }

            // Kiểm tra tồn tại
            await GetByMaSVAsync(masv);

            await _repository.UpdateBasicAsync(masv, dto);
        }

        public async Task DeleteByMaSVAsync(string masv)
        {
            await GetByMaSVAsync(masv); // Sẽ throw NotFound nếu không có
            await _repository.DeleteByMaSVAsync(masv);
        }

        public async Task<long> DeleteByMaLopAsync(string malop)
        {
            return await _repository.DeleteByMaLopAsync(malop);
        }

        public async Task AddLanguageAsync(string masv, LanguageDto dto)
        {
            await GetByMaSVAsync(masv);
            var lang = new Language
            {
                TenNgoaiNgu = dto.TenNgoaiNgu,
                TrinhDo = dto.TrinhDo,
                CertLink = dto.CertLink,
                GhiChu = dto.GhiChu
            };
            await _repository.AddLanguageAsync(masv, lang);
        }

        public async Task AddSubjectAsync(string masv, SubjectDto dto)
        {
            ValidateScore(dto.Diem);
            if (dto.STC <= 0) throw new ValidationException("Số tín chỉ phải lớn hơn 0.");
            
            var subject = new Subject
            {
                MaMon = dto.MaMon,
                TenMon = dto.TenMon,
                Diem = dto.Diem,
                STC = dto.STC,
                DanhGia = dto.Diem > 4 ? "Đạt" : "Không đạt"
            };
            await _repository.AddSubjectAsync(masv, subject);
        }

        public async Task UpdateSubjectScoreAsync(string masv, string mamon, double score)
        {
            ValidateScore(score);
            await _repository.UpdateSubjectScoreAsync(masv, mamon, score);
        }

        public async Task ReplaceStudentAsync(string masv, StudentCreateDto dto)
        {
            ValidateStudent(dto.MaSV, dto.HoTen, dto.Tuoi, dto.Phai, dto.MaLop, dto.Email, dto.SDT);

            var existing = await GetByMaSVAsync(masv);

            var student = new Student
            {
                Id = existing.Id,
                MaSV = dto.MaSV,
                HoTen = dto.HoTen,
                Tuoi = dto.Tuoi,
                Phai = dto.Phai,
                NamHoc = dto.NamHoc ?? "",
                Khoa = dto.Khoa ?? "",
                MaLop = dto.MaLop,
                Email = dto.Email ?? "",
                SDT = dto.SDT ?? "",
                NgoaiNgu = dto.NgoaiNgu?.Select(nn => new Language
                {
                    TenNgoaiNgu = nn.TenNgoaiNgu,
                    TrinhDo = nn.TrinhDo,
                    CertLink = nn.CertLink,
                    GhiChu = nn.GhiChu
                }).ToList() ?? new List<Language>(),
                MonHoc = dto.MonHoc?.Select(mh => 
                {
                    ValidateScore(mh.Diem);
                    if (mh.STC <= 0) throw new ValidationException($"Số tín chỉ của môn '{mh.MaMon}' phải lớn hơn 0.");
                    return new Subject
                    {
                        MaMon = mh.MaMon,
                        TenMon = mh.TenMon,
                        Diem = mh.Diem,
                        STC = mh.STC,
                        DanhGia = mh.Diem > 4 ? "Đạt" : "Không đạt"
                    };
                }).ToList() ?? new List<Subject>()
            };

            await _repository.ReplaceStudentAsync(existing.Id, student);
        }

        public async Task<DashboardKpiDto> GetDashboardKpiAsync()
        {
            return await _repository.GetDashboardKpiAsync();
        }

        public async Task<List<ClassStatisticDto>> GetClassStatisticsAsync()
        {
            return await _repository.GetClassStatisticsAsync();
        }

        public async Task<List<LanguageStatisticDto>> GetLanguageStatisticsAsync()
        {
            return await _repository.GetLanguageStatisticsAsync();
        }

        public async Task<List<AcademicClassificationDto>> GetAcademicClassificationsAsync()
        {
            return await _repository.GetAcademicClassificationsAsync();
        }

        public async Task<List<StudentGpaDto>> GetStudentGpasAsync()
        {
            return await _repository.GetStudentGpasAsync();
        }

        private void ValidateStudent(string masv, string hoten, int tuoi, string phai, string malop, string? email, string? sdt)
        {
            if (string.IsNullOrWhiteSpace(masv)) throw new ValidationException("Mã sinh viên bắt buộc.");
            if (string.IsNullOrWhiteSpace(hoten)) throw new ValidationException("Họ tên không được để trống.");
            if (string.IsNullOrWhiteSpace(malop)) throw new ValidationException("Mã lớp không được để trống.");
            if (tuoi <= 0) throw new ValidationException("Tuổi phải là số nguyên dương lớn hơn 0.");
            if (phai != "Nam" && phai != "Nữ") throw new ValidationException("Phái chỉ nhận giá trị 'Nam' hoặc 'Nữ'.");
            
            if (!string.IsNullOrWhiteSpace(email) && !email.Contains("@"))
                throw new ValidationException("Email không đúng định dạng (phải chứa ký tự '@').");
            
            if (!string.IsNullOrWhiteSpace(sdt))
            {
                if (!sdt.StartsWith("0")) throw new ValidationException("Số điện thoại phải bắt đầu bằng '0'.");
                if (sdt.Length < 10 || sdt.Length > 11) throw new ValidationException("Số điện thoại phải có 10 hoặc 11 chữ số.");
                if (!sdt.All(char.IsDigit)) throw new ValidationException("Số điện thoại chỉ được chứa các chữ số.");
            }
        }

        private void ValidateScore(double score)
        {
            if (score < 0.0 || score > 10.0)
            {
                throw new ValidationException($"Điểm {score} không hợp lệ. Điểm phải nằm trong khoảng [0.0, 10.0].");
            }
        }

        public async Task<List<Subject>> GetAllUniqueSubjectsAsync()
        {
            return await _repository.GetAllUniqueSubjectsAsync();
        }

        public async Task<List<string>> GetAllUniqueLanguagesAsync()
        {
            return await _repository.GetAllUniqueLanguagesAsync();
        }
    }
}
