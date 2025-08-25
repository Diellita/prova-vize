using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security;
using WebApi.Auth;
using WebApi.DTOs.AdvanceRequests;
using WebApi.Models;
using WebApi.Services.AdvanceRequests;
using System.Linq;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("advance-request")]
    public class AdvanceRequestsController : ControllerBase
    {
        private readonly IAdvanceRequestService _service;

        public AdvanceRequestsController(IAdvanceRequestService service)
        {
            _service = service;
        }

        // POST /advance-request
        [HttpPost]
        [Authorize(Roles = "CLIENTE")]
        public async Task<IActionResult> Create([FromBody] AdvanceRequestCreateDto dto, CancellationToken ct)
        {
            string clientId = User.GetClientId();
            if (string.IsNullOrEmpty(clientId)) return Unauthorized("Cliente não identificado.");

            try
            {
                var result = await _service.CreateAsync(dto.ContratoId, dto.ParcelaNumero, dto.Notes, clientId, ct);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (SecurityException)
            {
                return Forbid();
            }
        }

        // GET /advance-request/{id}
        [HttpGet("{id:int}")]
        [Authorize(Roles = "CLIENTE,APROVADOR")]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
        {
            string clientId = User.GetClientId();
            var result = await _service.GetByIdAsync(id, clientId, ct);
            if (result == null) return NotFound();
            return Ok(result);
        }

        // GET /advance-request
        [HttpGet]
        [Authorize(Roles = "CLIENTE")]
        public async Task<IActionResult> GetAdvanceRequests([FromQuery] AdvanceRequestStatus? status = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
        {
            string clientId = User.GetClientId();
            if (string.IsNullOrEmpty(clientId)) return Unauthorized("Cliente não identificado.");

            var result = await _service.GetAdvanceRequestsAsync(
                clientId,
                status,
                startDate,
                endDate,
                page,
                pageSize,
                ct
            );

            return Ok(result);
        }

        // GET /advance-request/admin?status=PENDENTE&startDate=...&endDate=...&page=1&pageSize=10
        [HttpGet("admin")]
        [Authorize(Roles = "APROVADOR")]
        public async Task<IActionResult> GetAdvanceRequestsAdmin(
            [FromQuery] AdvanceRequestStatus? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            var result = await _service.GetAdvanceRequestsAdminAsync(
                status, startDate, endDate, page, pageSize, ct);

            return Ok(result);
        }

        // PUT /advance-request/approve
        [HttpPut("approve")]
        [Authorize(Roles = "APROVADOR")]
        public async Task<IActionResult> ApproveBulkAsync([FromBody] AdvanceRequestApproveDto dto, CancellationToken ct)
        {
            if (dto == null || dto.Ids == null || !dto.Ids.Any())
                return BadRequest(new { error = "Nenhuma solicitação informada para aprovação." });

            await _service.ApproveAsync(dto.Ids, ct);
            return NoContent();
        }

        // PUT /advance-request/reject
        [HttpPut("reject")]
        [Authorize(Roles = "APROVADOR")]
        public async Task<IActionResult> RejectBulkAsync(
            [FromBody] AdvanceRequestApproveDto dto,
            CancellationToken ct)
        {
            if (dto == null || dto.Ids == null || !dto.Ids.Any())
                return BadRequest("Ids requeridos.");

            await _service.RejectAsync(dto.Ids, ct);
            return NoContent();
        }

    }
    
}
