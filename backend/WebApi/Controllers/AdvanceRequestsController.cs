using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security;
using WebApi.Auth;
using WebApi.DTOs.AdvanceRequests;
using WebApi.Models;
using WebApi.Services.AdvanceRequests;

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
                var result = await _service.CreateAsync(dto.ContratoId, dto.Notes, clientId, ct);
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
        public async Task<IActionResult> GetAdvanceRequests(
            [FromQuery] AdvanceRequestStatus? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
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
    }
}
