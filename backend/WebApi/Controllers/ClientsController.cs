using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("clients")]
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ClientsController(AppDbContext db) { _db = db; }

        // GET /clients
        [HttpGet]
        [Authorize(Roles = "CLIENTE,APROVADOR")]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var list = await _db.Clientes
                .AsNoTracking()
                .Select(c => new { id = c.Id, nome = c.Nome, email = c.Email })
                .ToListAsync(ct);

            return Ok(list);
        }
    }
}
