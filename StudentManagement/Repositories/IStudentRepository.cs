using System.Collections.Generic;
using System.Threading.Tasks;
using StudentManagement.Models;
using StudentManagement.DTOs;

namespace StudentManagement.Repositories
{
    public interface IStudentRepository
    {
        Task<List<Student>> GetAllAsync(string? malop = null);
        Task<Student?> GetByMaSVAsync(string masv);
        Task CreateAsync(Student student);
        Task UpdateBasicAsync(string masv, StudentUpdateDto updateDto);
        Task DeleteByMaSVAsync(string masv);
        Task<long> DeleteByMaLopAsync(string malop);
        
        Task AddLanguageAsync(string masv, Language language);
        Task AddSubjectAsync(string masv, Subject subject);
        Task UpdateSubjectScoreAsync(string masv, string mamon, double score);
        Task ReplaceStudentAsync(string id, Student student);
        
        Task<List<ClassStatisticDto>> GetStudentsCountByClassAsync();
        Task<List<StudentGpaDto>> GetStudentGpasAsync();
    }
}
