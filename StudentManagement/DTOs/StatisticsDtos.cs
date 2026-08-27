using System.Collections.Generic;

namespace StudentManagement.DTOs
{
    public class DashboardKpiDto
    {
        public int TotalStudents { get; set; }
        public int TotalClasses { get; set; }
        public double AverageGpa { get; set; }
        public double MalePercentage { get; set; }
        public double FemalePercentage { get; set; }
    }

    public class ClassStatisticDto
    {
        public string MaLop { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public double MaxGpa { get; set; }
        public double MinGpa { get; set; }
    }

    public class LanguageStatisticDto
    {
        public string Language { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AcademicClassificationDto
    {
        public string Classification { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class StudentGpaDto
    {
        public string MaSV { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public double GPA { get; set; }
    }
}
