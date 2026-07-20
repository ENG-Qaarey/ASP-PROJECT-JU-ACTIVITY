using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/departments")]
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DepartmentsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _db.Departments
                .OrderBy(d => d.Name)
                .Select(d => new { id = d.Id.ToString(), name = d.Name })
                .ToListAsync();

            return Ok(departments);
        }

        public class CreateDepartmentRequest
        {
            public string Name { get; set; } = string.Empty;
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { Success = false, Message = "Name is required" });

            if (await _db.Departments.AnyAsync(d => d.Name.ToLower() == request.Name.ToLower()))
                return BadRequest(new { Success = false, Message = "Department already exists" });

            var department = new Department { Name = request.Name.Trim() };
            _db.Departments.Add(department);
            await _db.SaveChangesAsync();

            return Ok(new { id = department.Id.ToString(), name = department.Name });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var department = await _db.Departments.FindAsync(id);
            if (department == null)
                return NotFound(new { Success = false, Message = "Department not found" });

            _db.Departments.Remove(department);
            await _db.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Department deleted" });
        }
    }
}
