using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using StudentManagement.Data;
using StudentManagement.Models;
using StudentManagement.DTOs;
using StudentManagement.Exceptions;

namespace StudentManagement.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly IMongoCollection<Student> _students;

        public StudentRepository(MongoDbContext context)
        {
            _students = context.Students;
        }

        public async Task<List<Student>> GetAllAsync(string? malop = null)
        {
            if (!string.IsNullOrEmpty(malop))
            {
                var filter = Builders<Student>.Filter.Eq(s => s.MaLop, malop);
                return await _students.Find(filter).ToListAsync();
            }
            return await _students.Find(_ => true).ToListAsync();
        }

        public async Task<Student?> GetByMaSVAsync(string masv)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaSV, masv);
            return await _students.Find(filter).FirstOrDefaultAsync();
        }

        public async Task CreateAsync(Student student)
        {
            try
            {
                await _students.InsertOneAsync(student);
            }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                throw new DuplicateKeyException($"Sinh viên với mã '{student.MaSV}' đã tồn tại.");
            }
        }

        public async Task UpdateBasicAsync(string masv, StudentUpdateDto updateDto)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaSV, masv);
            
            var updateDefinitionBuilder = Builders<Student>.Update;
            var updates = new List<UpdateDefinition<Student>>();

            if (updateDto.HoTen != null) updates.Add(updateDefinitionBuilder.Set(s => s.HoTen, updateDto.HoTen));
            if (updateDto.Tuoi.HasValue) updates.Add(updateDefinitionBuilder.Set(s => s.Tuoi, updateDto.Tuoi.Value));
            if (updateDto.Phai != null) updates.Add(updateDefinitionBuilder.Set(s => s.Phai, updateDto.Phai));
            if (updateDto.NamHoc != null) updates.Add(updateDefinitionBuilder.Set(s => s.NamHoc, updateDto.NamHoc));
            if (updateDto.Khoa != null) updates.Add(updateDefinitionBuilder.Set(s => s.Khoa, updateDto.Khoa));
            if (updateDto.MaLop != null) updates.Add(updateDefinitionBuilder.Set(s => s.MaLop, updateDto.MaLop));

            if (updates.Count > 0)
            {
                var combinedUpdate = updateDefinitionBuilder.Combine(updates);
                await _students.UpdateOneAsync(filter, combinedUpdate);
            }
        }

        public async Task DeleteByMaSVAsync(string masv)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaSV, masv);
            await _students.DeleteOneAsync(filter);
        }

        public async Task<long> DeleteByMaLopAsync(string malop)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaLop, malop);
            var result = await _students.DeleteManyAsync(filter);
            return result.DeletedCount;
        }

        public async Task AddLanguageAsync(string masv, Language language)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaSV, masv);
            var update = Builders<Student>.Update.Push(s => s.NgoaiNgu, language);
            await _students.UpdateOneAsync(filter, update);
        }

        public async Task AddSubjectAsync(string masv, Subject subject)
        {
            var filter = Builders<Student>.Filter.Eq(s => s.MaSV, masv);
            // Kiểm tra trùng mã môn trước khi push. Có thể xử lý ở service, nhưng MongoDB có $addToSet nếu dùng object (không khả thi nếu chỉ check theo mã môn). 
            // dùng filter kiểm tra mamon chưa tồn tại trong monhoc.
            var filterNotExists = Builders<Student>.Filter.And(
                Builders<Student>.Filter.Eq(s => s.MaSV, masv),
                Builders<Student>.Filter.Not(Builders<Student>.Filter.ElemMatch(s => s.MonHoc, m => m.MaMon == subject.MaMon))
            );

            var update = Builders<Student>.Update.Push(s => s.MonHoc, subject);
            var result = await _students.UpdateOneAsync(filterNotExists, update);

            if (result.MatchedCount == 0)
            {
                // Nếu matched = 0, có 2 trường hợp: sai masv hoặc mã môn đã tồn tại. Service sẽ check chi tiết hơn.
                throw new DuplicateKeyException($"Mã môn '{subject.MaMon}' đã tồn tại trong danh sách môn học của sinh viên '{masv}', hoặc sinh viên không tồn tại.");
            }
        }

        public async Task UpdateSubjectScoreAsync(string masv, string mamon, double score)
        {
            var filter = Builders<Student>.Filter.And(
                Builders<Student>.Filter.Eq(s => s.MaSV, masv),
                Builders<Student>.Filter.ElemMatch(s => s.MonHoc, m => m.MaMon == mamon)
            );

            // Positional operator $
            var update = Builders<Student>.Update.Set("monhoc.$.diem", score);
            
            var result = await _students.UpdateOneAsync(filter, update);
            if (result.MatchedCount == 0)
            {
                throw new NotFoundException($"Không tìm thấy sinh viên '{masv}' có đăng ký môn '{mamon}'.");
            }
        }

        public async Task ReplaceStudentAsync(string id, Student student)
        {
            try
            {
                var filter = Builders<Student>.Filter.Eq(s => s.Id, id);
                await _students.ReplaceOneAsync(filter, student);
            }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                throw new DuplicateKeyException($"Sinh viên với mã '{student.MaSV}' đã tồn tại.");
            }
        }
    }
}
