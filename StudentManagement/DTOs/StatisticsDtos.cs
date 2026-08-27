using System.Collections.Generic;

namespace StudentManagement.DTOs
{
    public class ClassStatisticDto
    {
        public string MaLop { get; set; } = string.Empty;
        public string Khoa { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
    }

    public class StudentGpaDto
    {
        public string MaSV { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public double GPA { get; set; }
    }
}
