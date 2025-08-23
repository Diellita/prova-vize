namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestListItemDto
    {
        public Guid Id { get; set; }
        public Guid ContratoId { get; set; }
        public string Status { get; set; } = default!;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
