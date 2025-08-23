using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class Cliente
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Senha { get; set; } = string.Empty; // hash depois
      
        // vínculo obrigatório ao usuário (que guarda o TipoUsuario)
        [Required]
        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

    }
}
