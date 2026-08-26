using System.Collections.Generic;
using System.Threading.Tasks;
using StudentManagement.Models;
using StudentManagement.DTOs;

namespace StudentManagement.Services
{
    public interface IStudentService
    {
        Task<List<Student>> GetAllAsync(string? malop = null);
        Task<Student> GetByMaSVAsync(string masv);
        Task CreateAsync(StudentCreateDto dto);
        Task UpdateBasicAsync(string masv, StudentUpdateDto dto);
        Task DeleteByMaSVAsync(string masv);
        Task<long> DeleteByMaLopAsync(string malop);
        Task AddLanguageAsync(string masv, LanguageDto languageDto);
        Task AddSubjectAsync(string masv, SubjectDto subjectDto);
        Task UpdateSubjectScoreAsync(string masv, string mamon, double score);
        Task ReplaceStudentAsync(string masv, StudentCreateDto dto);
    }
}
