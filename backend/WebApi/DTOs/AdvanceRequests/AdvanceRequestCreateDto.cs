using System.ComponentModel.DataAnnotations;

namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestCreateDto
    {
        [Required]
        public int ContratoId { get; set; }

        public int? ParcelaNumero { get; set; }

        public string? Notes { get; set; }

    }
}
