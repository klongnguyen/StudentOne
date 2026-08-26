using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Exceptions;
using StudentManagement.Services;

namespace StudentManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _service;

        public StudentsController(IStudentService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? malop)
        {
            var students = await _service.GetAllAsync(malop);
            return Ok(students);
        }

        [HttpGet("{masv}")]
        public async Task<IActionResult> GetByMaSV(string masv)
        {
            try
            {
                var student = await _service.GetByMaSVAsync(masv);
                return Ok(student);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StudentCreateDto dto)
        {
            try
            {
                await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByMaSV), new { masv = dto.MaSV }, dto);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (DuplicateKeyException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{masv}")]
        public async Task<IActionResult> UpdateBasic(string masv, [FromBody] StudentUpdateDto dto)
        {
            try
            {
                await _service.UpdateBasicAsync(masv, dto);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{masv}")]
        public async Task<IActionResult> Delete(string masv)
        {
            try
            {
                await _service.DeleteByMaSVAsync(masv);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("class/{malop}")]
        public async Task<IActionResult> DeleteByClass(string malop)
        {
            var deletedCount = await _service.DeleteByMaLopAsync(malop);
            return Ok(new { message = $"Đã xóa {deletedCount} sinh viên thuộc lớp {malop}." });
        }

        [HttpPost("{masv}/languages")]
        public async Task<IActionResult> AddLanguage(string masv, [FromBody] LanguageDto dto)
        {
            try
            {
                await _service.AddLanguageAsync(masv, dto);
                return Ok();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("{masv}/subjects")]
        public async Task<IActionResult> AddSubject(string masv, [FromBody] SubjectDto dto)
        {
            try
            {
                await _service.AddSubjectAsync(masv, dto);
                return Ok();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (DuplicateKeyException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("{masv}/subjects/{mamon}/score")]
        public async Task<IActionResult> UpdateScore(string masv, string mamon, [FromBody] double score)
        {
            try
            {
                await _service.UpdateSubjectScoreAsync(masv, mamon, score);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{masv}/replace")]
        public async Task<IActionResult> ReplaceStudent(string masv, [FromBody] StudentCreateDto dto)
        {
            try
            {
                await _service.ReplaceStudentAsync(masv, dto);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (DuplicateKeyException ex)
            {
                return Conflict(ex.Message);
            }
        }
    }
}
