using System;

namespace WebApi.Models
{
    public class Installment
    {
        public int Id { get; set; }            // PK interna
        public string InstallmentId { get; set; } = null!; // ex: "P001"
        public DateTime DueDate { get; set; }  // data de vencimento
        public decimal Amount { get; set; }    // valor
        public InstallmentStatus Status { get; set; } = InstallmentStatus.A_VENCER;

        // relacionamento
        public int ContractIdFk { get; set; }
        public Contract Contract { get; set; } = null!;
    }
}
