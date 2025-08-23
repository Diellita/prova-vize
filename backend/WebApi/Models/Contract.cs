using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WebApi.Models
{
    public class Contrato
    {
        [Key]
        public int Id { get; set; } // PK do contrato

        [Required]
        public string NomeContrato { get; set; } = string.Empty;

        // vínculo com o cliente (int)
        [Required]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        // status do contrato
        [Required]
        public ContractStatus Status { get; set; } = ContractStatus.PENDENTE;

        // última data da última parcela (UTC)
        [Required]
        public DateTime VencimentoContrato { get; set; }

        // auditoria (UTC)
        [Required]
        public DateTime DataAlteracao { get; set; }

        [Required]
        public DateTime DataInsercao { get; set; }

        // agregados
        [Required]
        public int NumeroParcelas { get; set; }

        // relação com parcelas
        public List<Parcela> Parcelas { get; set; } = new();
    }
}
