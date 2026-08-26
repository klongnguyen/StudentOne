using System.Collections.Generic;

namespace StudentManagement.DTOs
{
    public class StudentCreateDto
    {
        public string MaSV { get; set; } = null!;
        public string HoTen { get; set; } = null!;
        public int Tuoi { get; set; }
        public string Phai { get; set; } = null!;
        public string NamHoc { get; set; } = null!;
        public string Khoa { get; set; } = null!;
        public string MaLop { get; set; } = null!;
        public string Email { get; set; } = string.Empty;
        public string SDT { get; set; } = string.Empty;
        public List<LanguageDto>? NgoaiNgu { get; set; }
        public List<SubjectDto>? MonHoc { get; set; }
    }

    public class StudentUpdateDto
    {
        public string? HoTen { get; set; }
        public int? Tuoi { get; set; }
        public string? Phai { get; set; }
        public string? NamHoc { get; set; }
        public string? Khoa { get; set; }
        public string? MaLop { get; set; }
        public string? Email { get; set; }
        public string? SDT { get; set; }
    }

    public class LanguageDto
    {
        public string TenNgoaiNgu { get; set; } = null!;
        public string TrinhDo { get; set; } = null!;
        public string CertLink { get; set; } = null!;
        public string GhiChu { get; set; } = string.Empty;
    }

    public class SubjectDto
    {
        public string MaMon { get; set; } = null!;
        public string TenMon { get; set; } = null!;
        public double Diem { get; set; }
        public int STC { get; set; }
        public string DanhGia { get; set; } = string.Empty;
    }
}
