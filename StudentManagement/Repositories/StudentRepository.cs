using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Bson;
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
            if (updateDto.Email != null) updates.Add(updateDefinitionBuilder.Set(s => s.Email, updateDto.Email));
            if (updateDto.SDT != null) updates.Add(updateDefinitionBuilder.Set(s => s.SDT, updateDto.SDT));

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
            var update = Builders<Student>.Update
                .Set("monhoc.$.diem", score)
                .Set("monhoc.$.danhgia", score > 4 ? "Đạt" : "Không đạt");
            
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

        public async Task<DashboardKpiDto> GetDashboardKpiAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$facet", new BsonDocument
                {
                    { "totalInfo", new BsonArray
                        {
                            new BsonDocument("$group", new BsonDocument
                            {
                                { "_id", BsonNull.Value },
                                { "TotalStudents", new BsonDocument("$sum", 1) },
                                { "MaleCount", new BsonDocument("$sum", new BsonDocument("$cond", new BsonArray { new BsonDocument("$eq", new BsonArray { "$phai", "Nam" }), 1, 0 })) },
                                { "FemaleCount", new BsonDocument("$sum", new BsonDocument("$cond", new BsonArray { new BsonDocument("$eq", new BsonArray { "$phai", "Nữ" }), 1, 0 })) }
                            })
                        }
                    },
                    { "classInfo", new BsonArray
                        {
                            new BsonDocument("$group", new BsonDocument { { "_id", "$malop" } }),
                            new BsonDocument("$count", "TotalClasses")
                        }
                    },
                    { "gpaInfo", new BsonArray
                        {
                            new BsonDocument("$unwind", new BsonDocument { { "path", "$monhoc" }, { "preserveNullAndEmptyArrays", true } }),
                            new BsonDocument("$group", new BsonDocument
                            {
                                { "_id", "$masv" },
                                { "TotalWeightedScore", new BsonDocument("$sum", new BsonDocument("$multiply", new BsonArray { "$monhoc.diem", "$monhoc.stc" })) },
                                { "TotalCredits", new BsonDocument("$sum", "$monhoc.stc") }
                            }),
                            new BsonDocument("$project", new BsonDocument
                            {
                                { "GPA", new BsonDocument("$cond", new BsonArray { new BsonDocument("$gt", new BsonArray { "$TotalCredits", 0 }), new BsonDocument("$divide", new BsonArray { "$TotalWeightedScore", "$TotalCredits" }), 0 }) }
                            }),
                            new BsonDocument("$group", new BsonDocument
                            {
                                { "_id", BsonNull.Value },
                                { "AverageGpa", new BsonDocument("$avg", "$GPA") }
                            })
                        }
                    }
                })
            };

            var aggregate = await _students.AggregateAsync<BsonDocument>(pipeline);
            var result = await aggregate.FirstOrDefaultAsync();

            var dto = new DashboardKpiDto();
            if (result != null)
            {
                var totalInfo = result["totalInfo"].AsBsonArray.Count > 0 ? result["totalInfo"][0].AsBsonDocument : null;
                var classInfo = result["classInfo"].AsBsonArray.Count > 0 ? result["classInfo"][0].AsBsonDocument : null;
                var gpaInfo = result["gpaInfo"].AsBsonArray.Count > 0 ? result["gpaInfo"][0].AsBsonDocument : null;

                if (totalInfo != null)
                {
                    dto.TotalStudents = totalInfo["TotalStudents"].AsInt32;
                    int maleCount = totalInfo["MaleCount"].AsInt32;
                    int femaleCount = totalInfo["FemaleCount"].AsInt32;
                    if (dto.TotalStudents > 0)
                    {
                        dto.MalePercentage = Math.Round((double)maleCount / dto.TotalStudents * 100, 1);
                        dto.FemalePercentage = Math.Round((double)femaleCount / dto.TotalStudents * 100, 1);
                    }
                }
                
                if (classInfo != null) dto.TotalClasses = classInfo["TotalClasses"].AsInt32;
                if (gpaInfo != null) dto.AverageGpa = Math.Round(gpaInfo["AverageGpa"].AsDouble, 2);
            }
            return dto;
        }

        public async Task<List<ClassStatisticDto>> GetClassStatisticsAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$unwind", new BsonDocument { { "path", "$monhoc" }, { "preserveNullAndEmptyArrays", true } }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", new BsonDocument { { "masv", "$masv" }, { "malop", "$malop" } } },
                    { "TotalWeightedScore", new BsonDocument("$sum", new BsonDocument("$multiply", new BsonArray { "$monhoc.diem", "$monhoc.stc" })) },
                    { "TotalCredits", new BsonDocument("$sum", "$monhoc.stc") }
                }),
                new BsonDocument("$project", new BsonDocument
                {
                    { "malop", "$_id.malop" },
                    { "GPA", new BsonDocument("$cond", new BsonArray { new BsonDocument("$gt", new BsonArray { "$TotalCredits", 0 }), new BsonDocument("$divide", new BsonArray { "$TotalWeightedScore", "$TotalCredits" }), 0 }) }
                }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$malop" },
                    { "TotalStudents", new BsonDocument("$sum", 1) },
                    { "MaxGpa", new BsonDocument("$max", "$GPA") },
                    { "MinGpa", new BsonDocument("$min", "$GPA") }
                }),
                new BsonDocument("$project", new BsonDocument
                {
                    { "_id", 0 },
                    { "MaLop", "$_id" },
                    { "TotalStudents", 1 },
                    { "MaxGpa", new BsonDocument("$round", new BsonArray { "$MaxGpa", 2 }) },
                    { "MinGpa", new BsonDocument("$round", new BsonArray { "$MinGpa", 2 }) }
                }),
                new BsonDocument("$sort", new BsonDocument("MaLop", 1))
            };

            var aggregate = await _students.AggregateAsync<ClassStatisticDto>(pipeline);
            return await aggregate.ToListAsync();
        }

        public async Task<List<LanguageStatisticDto>> GetLanguageStatisticsAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$unwind", "$ngoaingu"),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$ngoaingu.tenNgoaiNgu" },
                    { "Count", new BsonDocument("$sum", 1) }
                }),
                new BsonDocument("$project", new BsonDocument
                {
                    { "_id", 0 },
                    { "Language", "$_id" },
                    { "Count", 1 }
                }),
                new BsonDocument("$sort", new BsonDocument("Count", -1))
            };
            var aggregate = await _students.AggregateAsync<LanguageStatisticDto>(pipeline);
            return await aggregate.ToListAsync();
        }

        public async Task<List<AcademicClassificationDto>> GetAcademicClassificationsAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$unwind", new BsonDocument { { "path", "$monhoc" }, { "preserveNullAndEmptyArrays", true } }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$masv" },
                    { "TotalWeightedScore", new BsonDocument("$sum", new BsonDocument("$multiply", new BsonArray { "$monhoc.diem", "$monhoc.stc" })) },
                    { "TotalCredits", new BsonDocument("$sum", "$monhoc.stc") }
                }),
                new BsonDocument("$project", new BsonDocument
                {
                    { "GPA", new BsonDocument("$cond", new BsonArray { new BsonDocument("$gt", new BsonArray { "$TotalCredits", 0 }), new BsonDocument("$divide", new BsonArray { "$TotalWeightedScore", "$TotalCredits" }), 0 }) }
                }),
                new BsonDocument("$bucket", new BsonDocument
                {
                    { "groupBy", "$GPA" },
                    { "boundaries", new BsonArray { 0, 5.5, 7.0, 8.5, 10.1 } }, // 10.1 is upper bound so 10.0 is included in Xuat sac
                    { "default", "Unknown" },
                    { "output", new BsonDocument { { "Count", new BsonDocument("$sum", 1) } } }
                })
            };

            var aggregate = await _students.AggregateAsync<BsonDocument>(pipeline);
            var results = await aggregate.ToListAsync();

            var list = new List<AcademicClassificationDto>
            {
                new AcademicClassificationDto { Classification = "Trung bình/Yếu", Count = 0 },
                new AcademicClassificationDto { Classification = "Khá", Count = 0 },
                new AcademicClassificationDto { Classification = "Giỏi", Count = 0 },
                new AcademicClassificationDto { Classification = "Xuất sắc", Count = 0 }
            };

            foreach (var r in results)
            {
                if (r["_id"].IsNumeric)
                {
                    double bound = r["_id"].ToDouble();
                    if (bound == 0) list[0].Count = r["Count"].AsInt32;
                    else if (bound == 5.5) list[1].Count = r["Count"].AsInt32;
                    else if (bound == 7.0) list[2].Count = r["Count"].AsInt32;
                    else if (bound == 8.5) list[3].Count = r["Count"].AsInt32;
                }
            }

            return list;
        }

        public async Task<List<StudentGpaDto>> GetStudentGpasAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$unwind", new BsonDocument
                {
                    { "path", "$monhoc" },
                    { "preserveNullAndEmptyArrays", true }
                }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", new BsonDocument { { "MaSV", "$masv" }, { "HoTen", "$hoten" } } },
                    { "TotalWeightedScore", new BsonDocument("$sum", new BsonDocument("$multiply", new BsonArray { "$monhoc.diem", "$monhoc.stc" })) },
                    { "TotalCredits", new BsonDocument("$sum", "$monhoc.stc") }
                }),
                new BsonDocument("$project", new BsonDocument
                {
                    { "_id", 0 },
                    { "MaSV", "$_id.MaSV" },
                    { "HoTen", "$_id.HoTen" },
                    { "GPA", new BsonDocument("$cond", new BsonArray
                        {
                            new BsonDocument("$gt", new BsonArray { "$TotalCredits", 0 }),
                            new BsonDocument("$divide", new BsonArray { "$TotalWeightedScore", "$TotalCredits" }),
                            0
                        }) 
                    }
                }),
                new BsonDocument("$sort", new BsonDocument("GPA", -1)),
                new BsonDocument("$limit", 5)
            };

            var aggregate = await _students.AggregateAsync<StudentGpaDto>(pipeline);
            return await aggregate.ToListAsync();
        }
    }
}
