using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public TipoUsuario TipoUsuario { get; set; }

        // relação 1:1 com Cliente (opcional)
        public Cliente? Cliente { get; set; }
    }
}
