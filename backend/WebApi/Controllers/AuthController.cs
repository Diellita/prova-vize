using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApi.Data;
using WebApi.Models;

namespace WebApi.Controllers;

public record LoginDto(string Email, string Password);
public record TokenResponse(string AccessToken, string Role, string UserId);

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _cfg;
    private readonly AppDbContext _db;

    // Aprovador fixo (simples para teste)
    private const string ApproverEmail = "aprovador.demo@vize.com";
    private const string ApproverPassword = "123456";

    public AuthController(IConfiguration cfg, AppDbContext db)
    {
        _cfg = cfg;
        _db  = db;
    }

    [HttpPost("token")]
        public async Task<ActionResult<TokenResponse>> Token([FromBody] LoginDto dto, CancellationToken ct)
        {
            if (dto is null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email e senha são obrigatórios.");

            var email = dto.Email.Trim();

            // 1) APROVADOR em memória (checa ANTES do cliente do banco)
            if (email.Equals(ApproverEmail, StringComparison.OrdinalIgnoreCase) && dto.Password == ApproverPassword)
            {
                var tokenAprov = IssueJwt(
                    userId: "approver-1",
                    email: ApproverEmail,
                    role: "APROVADOR",
                    clientId: null
                );
                return Ok(new TokenResponse(tokenAprov, "APROVADOR", "approver-1"));
            }

            // 2) CLIENTE no banco
            var cliente = await _db.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Email == email && c.Senha == dto.Password, ct);

            if (cliente != null)
            {
                var tokenCliente = IssueJwt(
                    userId: $"client-{cliente.Id:D2}",
                    email: cliente.Email,
                    role: "CLIENTE",
                    clientId: cliente.Id.ToString()
                );
                return Ok(new TokenResponse(tokenCliente, "CLIENTE", $"client-{cliente.Id:D2}"));
            }

            // 3) Credenciais inválidas
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

    private string IssueJwt(string userId, string email, string role, string? clientId)
    {
        var section = _cfg.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(section["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role),
            new("role", role)
        };
        if (!string.IsNullOrWhiteSpace(clientId))
            claims.Add(new Claim("clientId", clientId));

        var token = new JwtSecurityToken(
            issuer: section["Issuer"],
            audience: section["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
