using System;
using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class Parcela
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NumeroParcela { get; set; }

        [Required]
        public decimal Valor { get; set; }

        [Required]
        public DateTime Vencimento { get; set; }

        [Required]
        public InstallmentStatus Status { get; set; }

        [Required]
        public int ContratoId { get; set; }

        public Contrato Contrato { get; set; } = null!;

        [Required]
        public int ClienteId { get; set; }

        public Cliente Cliente { get; set; } = null!;
    }
}
