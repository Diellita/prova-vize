// backend/Controllers/ContractsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApi.Data;
using WebApi.Models;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize] // exige JWT
    public class ContractsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ContractsController(AppDbContext db)
        {
            _db = db;
        }

        // ==== DTOs tipados (evita 'dynamic' no EF) ==========================
        public sealed class ContractListItemDto
        {
            public int id { get; set; }
            public string code { get; set; } = "";
            public int ownerId { get; set; }
            public string ownerName { get; set; } = "";
        }

        public sealed class ParcelaDto
        {
            public int id { get; set; }
            public int numero { get; set; }
            public decimal valor { get; set; }
            public DateTime dueDate { get; set; }
            public string status { get; set; } = "";
        }

        public sealed class ContractDetailDto
        {
            public int id { get; set; }
            public string code { get; set; } = "";
            public int ownerId { get; set; }
            public string ownerName { get; set; } = "";
            public IEnumerable<ParcelaDto> parcelas { get; set; } = Array.Empty<ParcelaDto>();
        }
        // ====================================================================

        // Helpers
        private static string? GetRole(ClaimsPrincipal u) =>
            u.FindFirstValue(ClaimTypes.Role) ?? u.FindFirstValue("role");

        private static int? GetClientId(ClaimsPrincipal u)
        {
            // 1) tenta claim "clientId"
            var claimClientId = u.Claims
                .FirstOrDefault(c => c.Type.Equals("clientId", StringComparison.OrdinalIgnoreCase))
                ?.Value;

            if (int.TryParse(claimClientId, out var idParsed))
                return idParsed;

            // 2) fallback: extrai dígitos do sub/nameidentifier (ex: "client-02")
            var nameId = u.FindFirstValue(ClaimTypes.NameIdentifier) ?? u.FindFirstValue("sub");
            if (!string.IsNullOrWhiteSpace(nameId))
            {
                var digits = new string(nameId.Where(char.IsDigit).ToArray());
                if (int.TryParse(digits, out var id2)) return id2;
            }
            return null;
        }

        // GET /contracts  -> apenas meus contratos (CLIENTE)
        [HttpGet]
        public async Task<IActionResult> GetMyContracts()
        {
            var role = GetRole(User);
            var clienteId = GetClientId(User);

            if (role == "APROVADOR")
                return Forbid(); // aprovador usa /contracts/all

            if (clienteId is null)
                return Unauthorized("clientId ausente no token.");

            var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Id == clienteId.Value);
            if (cliente == null)
                return NotFound("Cliente não encontrado.");

            var contratos = await _db.Contratos
                .Where(c => c.ClienteId == cliente.Id)
                .Select(c => new ContractListItemDto
                {
                    id = c.Id,
                    code = c.NomeContrato,
                    ownerId = c.ClienteId,
                    ownerName = cliente.Nome
                })
                .ToListAsync();

            return Ok(contratos);
        }

        // GET /contracts/all  -> aprovador enxerga todos; cliente vê só os dele
        // GET /contracts/all  -> QUALQUER usuário autenticado vê todos (read-only)
        [HttpGet("all")]
        public async Task<IActionResult> GetAllContracts()
        {
            var list = await _db.Contratos
                .Join(_db.Clientes, c => c.ClienteId, cl => cl.Id, (c, cl) => new ContractListItemDto
                {
                    id = c.Id,
                    code = c.NomeContrato,
                    ownerId = c.ClienteId,
                    ownerName = cl.Nome
                })
                .OrderBy(x => x.id)
                .ToListAsync();

            return Ok(list);
        }

        // GET /contracts/{id}/detail  -> detalhe + parcelas
        [HttpGet("{id:int}/detail")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var role = GetRole(User);
            var clienteId = GetClientId(User);

            var contrato = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == id);
            if (contrato is null)
                return NotFound("Contrato não encontrado.");

            // Se cliente, só pode ver contrato dele
            if (role == "CLIENTE")
            {
                if (clienteId is null) return Unauthorized("clientId ausente no token.");
                if (contrato.ClienteId != clienteId.Value) return Forbid();
            }
            else if (role != "APROVADOR")
            {
                return Forbid();
            }

            var parcelas = await _db.Parcelas
                .Where(p => p.ContratoId == id)
                .OrderBy(p => p.NumeroParcela)
                .Select(p => new ParcelaDto
                {
                    id = p.Id,
                    numero = p.NumeroParcela,
                    valor = p.Valor,
                    dueDate = p.Vencimento,
                    status = p.Status.ToString()
                })
                .ToListAsync();

            var ownerName = await _db.Clientes
                .Where(cl => cl.Id == contrato.ClienteId)
                .Select(cl => cl.Nome)
                .FirstOrDefaultAsync() ?? "—";

            var dto = new ContractDetailDto
            {
                id = contrato.Id,
                code = contrato.NomeContrato,
                ownerId = contrato.ClienteId,
                ownerName = ownerName,
                parcelas = parcelas
            };

            return Ok(dto);
        }
    }
}
