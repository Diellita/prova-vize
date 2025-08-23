using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class AdvanceRequestItem
    {
        [Key]
        public int Id { get; set; }

        // FK para a solicitação
        [Required]
        public int AdvanceRequestId { get; set; }
        public AdvanceRequest AdvanceRequest { get; set; } = null!;

        // FK para a parcela selecionada
        [Required]
        public int ParcelaId { get; set; }
        public Parcela Parcela { get; set; } = null!;

        // (opcional) snapshot do valor no momento da solicitação
        public decimal? ValorNaSolicitacao { get; set; }
    }
}
