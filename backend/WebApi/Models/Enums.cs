namespace WebApi.Models
{
    public enum InstallmentStatus
    {
        A_VENCER = 0,
        PAGO = 1,
        AGUARDANDO_APROVACAO = 2,
        ANTECIPADA = 3
    }
    public enum TipoUsuario
    {
        CLIENTE = 0,
        APROVADOR = 1
    }
}

