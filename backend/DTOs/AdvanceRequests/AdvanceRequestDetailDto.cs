namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestDetailDto
    {
        public Guid Id { get; set; }
        public Guid ContractId { get; set; }
        public string Status { get; set; } = default!; // PENDENTE, APROVADO, REPROVADO
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public string? Notes { get; set; }

        public List<AdvanceRequestItemDto> Items { get; set; } = new();
    }
}
