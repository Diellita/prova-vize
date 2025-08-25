namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestItemDto
    {
        public Guid InstallmentId { get; set; }
        public DateTime DueDateUtc { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = default!; // A_VENCER, AGUARDANDO_APROVACAO, etc.
    }
}
