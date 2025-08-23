namespace WebApi.Models
{
    public class AdvanceRequestItem
    {
        public int Id { get; set; }
        public int AdvanceRequestId { get; set; }
        public AdvanceRequest AdvanceRequest { get; set; } = null!;

        public string InstallmentId { get; set; } = null!; // referencia Installment.InstallmentId (código externo)
    }
}
