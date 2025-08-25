using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace WebApi.Controllers;

public record LoginDto(string Email, string Password);
public record TokenResponse(string AccessToken, string Role, string UserId);

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _cfg;
    public AuthController(IConfiguration cfg) => _cfg = cfg;

    [HttpPost("token")]
    public ActionResult<TokenResponse> Token([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest("Email is required");

        var role = dto.Email.Contains("aprovador", StringComparison.OrdinalIgnoreCase)
            ? "APROVADOR" : "CLIENTE";

        var userId = dto.Email.Trim().ToLowerInvariant();
        var token = GenerateJwt(userId, role);
        return Ok(new TokenResponse(token, role, userId));
    }

    private string GenerateJwt(string userId, string role)
    {
        var section = _cfg.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(section["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: section["Issuer"],
            audience: section["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(section["ExpiresMinutes"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
