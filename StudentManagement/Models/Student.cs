using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace StudentManagement.Models
{
    public class Student
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("masv")]
        public string MaSV { get; set; } = null!;

        [BsonElement("hoten")]
        public string HoTen { get; set; } = null!;

        [BsonElement("tuoi")]
        public int Tuoi { get; set; }

        [BsonElement("phai")]
        public string Phai { get; set; } = null!;

        [BsonElement("namhoc")]
        public string NamHoc { get; set; } = null!;

        [BsonElement("khoa")]
        public string Khoa { get; set; } = null!;

        [BsonElement("malop")]
        public string MaLop { get; set; } = null!;

        [BsonElement("ngoaingu")]
        public List<Language> NgoaiNgu { get; set; } = new List<Language>();

        [BsonElement("monhoc")]
        public List<Subject> MonHoc { get; set; } = new List<Subject>();
    }

    public class Language
    {
        [BsonElement("tenNgoaiNgu")]
        public string TenNgoaiNgu { get; set; } = null!;

        [BsonElement("trinhDo")]
        public string TrinhDo { get; set; } = null!;

        [BsonElement("certLink")]
        public string CertLink { get; set; } = null!;

        [BsonElement("ghiChu")]
        public string GhiChu { get; set; } = string.Empty;
    }

    public class Subject
    {
        [BsonElement("mamon")]
        public string MaMon { get; set; } = null!;

        [BsonElement("tenmon")]
        public string TenMon { get; set; } = null!;

        [BsonElement("diem")]
        public double Diem { get; set; }
    }
}
