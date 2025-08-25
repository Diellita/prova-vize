namespace WebApi.Models
{
    public class Contract
    {
        public int Id { get; set; }               // PK interna
        public string ContractId { get; set; } = null!; // ex: "CONTRATO-001" (código externo)
        public string ClientId { get; set; } = null!;    // ex: "CLIENTE-123"
        public string ClientName { get; set; } = null!;

        public List<Installment> Installments { get; set; } = new();
    }
}
