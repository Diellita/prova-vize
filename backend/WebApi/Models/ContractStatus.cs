namespace WebApi.Models
{
    public enum ContractStatus
    {
        LIQUIDADO = 0,   // todas parcelas pagas/antecipadas
        APROVADO = 1,    // aprovador aprovou a antecipação
        REPROVADO = 2,   // aprovador reprovou a antecipação
        PENDENTE = 3     // aguardando decisão do aprovador
    }
}
