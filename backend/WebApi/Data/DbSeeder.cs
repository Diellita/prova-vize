using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
        {
            // aplica migrações pendentes
            await db.Database.MigrateAsync(ct);

            if (await db.Usuarios.AnyAsync(ct)) return; // já seedado

            // ---- USUÁRIOS ----
            var usuarioCliente = new Usuario { TipoUsuario = TipoUsuario.CLIENTE };
            var usuarioAprovador = new Usuario { TipoUsuario = TipoUsuario.APROVADOR };

            db.Usuarios.AddRange(usuarioCliente, usuarioAprovador);
            await db.SaveChangesAsync(ct);

            // ---- CLIENTES ----
            var cliente = new Cliente
            {
                UsuarioId = usuarioCliente.Id,
                Nome = "Cliente Demo",
                Email = "cliente@demo.com",
                Senha = "123456" // TODO: usar hash em produção
            };
            db.Clientes.Add(cliente);
            await db.SaveChangesAsync(ct);

            // ---- CONTRATO ----
            var contrato = new Contrato
            {
                NomeContrato = "Contrato Demo 001",
                ClienteId = cliente.Id,
                Status = ContractStatus.PENDENTE,
                DataInsercao = DateTime.UtcNow,
                DataAlteracao = DateTime.UtcNow,
                NumeroParcelas = 0,            // será ajustado após criar parcelas
                VencimentoContrato = DateTime.UtcNow // será ajustado após criar parcelas
            };
            db.Contratos.Add(contrato);
            await db.SaveChangesAsync(ct);

            // ---- PARCELAS ----
            var hoje = DateTime.UtcNow.Date;

            var parcelas = new List<Parcela>
            {
                new Parcela
                {
                    ContratoId = contrato.Id,
                    ClienteId = cliente.Id,
                    NumeroParcela = 1,
                    Valor = 1000m,
                    Vencimento = hoje.AddDays(10), // não elegível (faltam < 30d)
                    Status = InstallmentStatus.A_VENCER
                },
                new Parcela
                {
                    ContratoId = contrato.Id,
                    ClienteId = cliente.Id,
                    NumeroParcela = 2,
                    Valor = 1000m,
                    Vencimento = hoje.AddDays(35), // elegível (>30d)
                    Status = InstallmentStatus.A_VENCER
                },
                new Parcela
                {
                    ContratoId = contrato.Id,
                    ClienteId = cliente.Id,
                    NumeroParcela = 3,
                    Valor = 1000m,
                    Vencimento = hoje.AddDays(-5),
                    Status = InstallmentStatus.PAGO
                }
            };

            db.Parcelas.AddRange(parcelas);
            await db.SaveChangesAsync(ct);

            // ajustar agregados do contrato
            contrato.NumeroParcelas = await db.Parcelas.CountAsync(p => p.ContratoId == contrato.Id, ct);
            contrato.VencimentoContrato = await db.Parcelas
                .Where(p => p.ContratoId == contrato.Id)
                .MaxAsync(p => p.Vencimento, ct);

            // Se todas as parcelas estiverem PAGO/ANTECIPADA → LIQUIDADO (aqui não está, ficará PENDENTE)
            var todasLiquidadas = await db.Parcelas
                .Where(p => p.ContratoId == contrato.Id)
                .AllAsync(p => p.Status == InstallmentStatus.PAGO || p.Status == InstallmentStatus.ANTECIPADA, ct);

            contrato.Status = todasLiquidadas ? ContractStatus.LIQUIDADO : ContractStatus.PENDENTE;
            contrato.DataAlteracao = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);
        }
    }
}
