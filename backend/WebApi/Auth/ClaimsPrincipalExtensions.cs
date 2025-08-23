using System.Security.Claims;

namespace WebApi.Auth
{
    public static class ClaimsPrincipalExtensions
    {
        public static string GetClientId(this ClaimsPrincipal user)
        {
            return user.FindFirstValue("clientId")
                ?? user.FindFirstValue("sub")
                ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? string.Empty;
        }
    }
}
