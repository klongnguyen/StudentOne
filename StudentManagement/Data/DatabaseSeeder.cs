using MongoDB.Driver;
using StudentManagement.Models;

namespace StudentManagement.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAndCreateIndexesAsync(MongoDbContext context)
        {
            var studentsCollection = context.Students;

            // 1. Tạo Indexes
            var indexKeysDefinition1 = Builders<Student>.IndexKeys.Ascending(s => s.MaSV);
            var indexOptions1 = new CreateIndexOptions { Unique = true, Name = "UX_Student_MaSV" };
            var indexModel1 = new CreateIndexModel<Student>(indexKeysDefinition1, indexOptions1);

            var indexKeysDefinition2 = Builders<Student>.IndexKeys.Ascending(s => s.MaLop).Ascending(s => s.HoTen);
            var indexOptions2 = new CreateIndexOptions { Name = "IX_Student_MaLop_HoTen" };
            var indexModel2 = new CreateIndexModel<Student>(indexKeysDefinition2, indexOptions2);

            await studentsCollection.Indexes.CreateManyAsync(new[] { indexModel1, indexModel2 });

            // 2. Seed Data
            long count = await studentsCollection.CountDocumentsAsync(Builders<Student>.Filter.Empty);
            if (count == 0)
            {
                var students = new List<Student>();
                for (int i = 1; i <= 20; i++)
                {
                    var maSV = $"SV{i:D3}";
                    students.Add(new Student
                    {
                        MaSV = maSV,
                        HoTen = $"Sinh Viên {i}",
                        Tuoi = 19 + (i % 3),
                        Phai = (i % 2 == 0) ? "Nữ" : "Nam",
                        NamHoc = "2023-2027",
                        Khoa = "Công nghệ thông tin",
                        MaLop = $"14DHTH{(i % 2) + 1:D2}", // 14DHTH01 hoặc 14DHTH02
                        NgoaiNgu = new List<Language>
                        {
                            new Language { TenNgoaiNgu = "Tiếng Anh", TrinhDo = "B1", CertLink = $"https://example.com/cert/{maSV}-en", GhiChu = "" }
                        },
                        MonHoc = new List<Subject>
                        {
                            new Subject { MaMon = "csdl", TenMon = "Cơ sở dữ liệu", Diem = 5.0 + (i % 6) },
                            new Subject { MaMon = "laptrinh", TenMon = "Lập trình Cơ bản", Diem = 6.0 + (i % 4) }
                        }
                    });
                }

                await studentsCollection.InsertManyAsync(students);
            }
        }
    }
}
