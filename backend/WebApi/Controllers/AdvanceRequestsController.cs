using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

public record AdvanceRequestCreateDto(string ContractId, List<string> InstallmentIds);

[ApiController]
[Route("advance-request")]
//[Authorize] // precisa de token
public class AdvanceRequestsController : ControllerBase
{
    [HttpPost]
    public IActionResult CreateAdvanceRequest([FromBody] AdvanceRequestCreateDto dto)
    {
        // por enquanto só retornamos o que recebemos
        return Ok(new
        {
            message = "Solicitação recebida (mock)",
            contractId = dto.ContractId,
            installments = dto.InstallmentIds
        });
    }
}
