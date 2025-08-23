using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class AdvanceRequest
    {
        [Key]
        public int Id { get; set; }

        // quem pediu (cliente dono do contrato)
        [Required]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        // contrato alvo da antecipação
        [Required]
        public int ContratoId { get; set; }    
        public Contrato Contrato { get; set; } = null!;

        // status da solicitação
        [Required]
        public AdvanceRequestStatus Status { get; set; } = AdvanceRequestStatus.PENDENTE;

        // metadados
        public string? Notes { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovedAt { get; set; }

        // itens (parcelas selecionadas)
        public List<AdvanceRequestItem> Items { get; set; } = new();
    }
}
