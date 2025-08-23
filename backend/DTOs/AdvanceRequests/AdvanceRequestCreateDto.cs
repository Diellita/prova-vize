namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestCreateDto
    {
        // Contrato alvo da antecipação (do cliente autenticado)
        public Guid ContractId { get; set; }

        // (Opcional) Observação que o cliente queira enviar
        public string? Notes { get; set; }
    }
}
