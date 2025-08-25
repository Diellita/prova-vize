using System;

namespace WebApi.Models
{
    public enum AdvanceRequestStatus
    {
        PENDENTE = 0,
        APROVADO = 1,
        REPROVADO = 2
    }

    public class AdvanceRequest
    {
        public int Id { get; set; }
        public string RequestCode { get; set; } = Guid.NewGuid().ToString("N"); // código externo, se quiser expor
        public string ContractId { get; set; } = null!;   // referencia o Contract.ContractId (código externo)
        public string RequestedByUserId { get; set; } = null!; // email do cliente (do token)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public AdvanceRequestStatus Status { get; set; } = AdvanceRequestStatus.PENDENTE;
        public DateTime? ApprovedAt { get; set; }

        public List<AdvanceRequestItem> Items { get; set; } = new();
    }
}
