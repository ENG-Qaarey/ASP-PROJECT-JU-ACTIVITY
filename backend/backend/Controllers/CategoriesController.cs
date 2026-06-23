using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CategoriesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _db.Categories
                .OrderBy(c => c.Name)
                .Select(c => new { id = c.Id.ToString(), name = c.Name })
                .ToListAsync();

            return Ok(categories);
        }

        public class CreateCategoryRequest
        {
            public string Name { get; set; } = string.Empty;
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { Success = false, Message = "Name is required" });

            if (await _db.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.ToLower()))
                return BadRequest(new { Success = false, Message = "Category already exists" });

            var category = new Category { Name = request.Name.Trim() };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            return Ok(new { id = category.Id.ToString(), name = category.Name });
        }
    }
}
