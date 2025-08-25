using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data
{
    public static class DbSeeder
    {
        public static async Task Seed(IServiceProvider services, CancellationToken ct = default)
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 0) Migrations
            await db.Database.MigrateAsync(ct);

            // 1) Garante pelo menos um Usuario CLIENTE e um APROVADOR "genéricos"
            if (!await db.Usuarios.AnyAsync(u => u.TipoUsuario == TipoUsuario.CLIENTE, ct))
            {
                db.Usuarios.Add(new Usuario { TipoUsuario = TipoUsuario.CLIENTE });
                await db.SaveChangesAsync(ct);
            }
            if (!await db.Usuarios.AnyAsync(u => u.TipoUsuario == TipoUsuario.APROVADOR, ct))
            {
                db.Usuarios.Add(new Usuario { TipoUsuario = TipoUsuario.APROVADOR });
                await db.SaveChangesAsync(ct);
            }

            // 2) Clientes seed (upsert)
            var clientesSeed = new List<Cliente>
            {
                new() { Nome = "APROVADOR",        Email = "aprovador.demo@vize.com",   Senha = "123456" },
                new() { Nome = "Ana Sousa",        Email = "ana.sousa@vize.com",        Senha = "as123456" },
                new() { Nome = "João Ribeiro",     Email = "joao.ribeiro@vize.com",     Senha = "jr123456" },
                new() { Nome = "Regina Falange",   Email = "regina.falange@vize.com",   Senha = "rf123456" },
                new() { Nome = "Gabriel Alves",    Email = "gabriel.alves@vize.com",    Senha = "ga123456" },
                new() { Nome = "Lucas Machado",    Email = "lucas.machado@vize.com",    Senha = "lm123456" },
                new() { Nome = "Pedro Rocha",      Email = "pedro.rocha@vize.com",      Senha = "pr123456" },
                new() { Nome = "Renato Santos",    Email = "renato.santos@vize.com",    Senha = "rs123456" },
                new() { Nome = "Fátima Mohamad",   Email = "fatima.mohamad@vize.com",   Senha = "fm123456" },
                new() { Nome = "Ibrahim Mustafa",  Email = "ibrahim.mustafa@vize.com",  Senha = "im123456" },
                new() { Nome = "Hideki Suzuki",    Email = "hideki.suzuki@vize.com",    Senha = "hs123456" },
            };

            db.ChangeTracker.Clear();

            foreach (var cli in clientesSeed)
            {
                var existing = await db.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Email == cli.Email, ct);
                if (existing is null)
                {
                    var novoUsuario = new Usuario { TipoUsuario = TipoUsuario.CLIENTE };
                    db.Usuarios.Add(novoUsuario);
                    await db.SaveChangesAsync(ct);

                    cli.Id = 0;
                    cli.UsuarioId = novoUsuario.Id;
                    db.Clientes.Add(cli);
                }
                else
                {
                    // upsert mantendo UsuarioId
                    existing.Nome  = cli.Nome;
                    existing.Senha = cli.Senha;
                    db.Clientes.Update(existing);
                }
            }
            await db.SaveChangesAsync(ct);

            // 3) Contratos + Parcelas (garante 6 contratos por cliente)
            var clientes = await db.Clientes.AsNoTracking().ToListAsync(ct);
            var agora = DateTime.UtcNow;

            foreach (var c in clientes)
            {
                // pula o "cliente" APROVADOR (se por acaso estiver na tabela de clientes)
                if (string.Equals(c.Nome, "APROVADOR", StringComparison.OrdinalIgnoreCase))
                    continue;

                // busca quantos contratos o cliente já tem
                var contratosDoCliente = await db.Contratos
                    .Where(x => x.ClienteId == c.Id)
                    .OrderBy(x => x.Id)
                    .ToListAsync(ct);

                var existentes = contratosDoCliente.Count;
                var faltantes = Math.Max(0, 6 - existentes);

                // gera iniciais do cliente (ex.: "Ana Sousa" -> "AS")
                string Iniciais(string nome)
                {
                    return string.Join("", (nome ?? "")
                        .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                        .Select(p => char.ToUpperInvariant(p[0])));
                }

                var iniciais = Iniciais(c.Nome);

                // cria os contratos que faltam (até totalizar 6)
                for (int i = 1; i <= faltantes; i++)
                {
                    // o sequencial por cliente será (existentes + i)
                    var seq = existentes + i;
                    var code = $"{iniciais}_{c.Id}_CONTRATO_{seq}";

                    var contrato = new Contrato
                    {
                        // NomeContrato será usado como "code" no front
                        NomeContrato       = code,
                        ClienteId          = c.Id,
                        // se seu modelo tiver essas props, ótimo; se não tiver, não tem problema:
                        // OwnerId = c.Id,
                        // OwnerName = c.Nome,

                        Status             = ContractStatus.PENDENTE,
                        DataInsercao       = agora,
                        DataAlteracao      = agora,
                        NumeroParcelas     = 12,
                        VencimentoContrato = agora.AddMonths(12),
                    };

                    db.Contratos.Add(CorrigirNulos(contrato));
                    await db.SaveChangesAsync(ct);

                    // cria 12 parcelas seguindo a regra
                    var parcelas = new List<Parcela>();
                    for (int np = 1; np <= 12; np++)
                    {
                        DateTime venc;
                        var status = InstallmentStatus.A_VENCER;

                        if (np == 1)
                        {
                            venc   = agora.AddDays(-10);             // já vencida e paga
                            status = InstallmentStatus.PAGO;
                        }
                        else if (np == 2)
                        {
                            venc   = agora.AddDays(20);              // < 30 dias (não elegível)
                        }
                        else if (np == 3)
                        {
                            venc   = agora.AddDays(45);              // > 30 dias (elegível)
                        }
                        else
                        {
                            venc = new DateTime(agora.Year, agora.Month, 10, 0, 0, 0, DateTimeKind.Utc).AddMonths(np - 1);
                        }

                        parcelas.Add(new Parcela
                        {
                            ContratoId     = contrato.Id,
                            ClienteId      = c.Id,
                            NumeroParcela  = np,
                            Valor          = 1600m,
                            Vencimento     = venc,
                            Status         = status
                        });
                    }

                    db.Parcelas.AddRange(parcelas);
                    await db.SaveChangesAsync(ct);
                }
            }

            // 4) Marca AGUARDANDO_APROVACAO somente no 1º contrato de cada cliente (parcela #4)
            var todosContratos = await db.Contratos
                .AsNoTracking()
                .OrderBy(c => c.Id)
                .ToListAsync(ct);

            var primeiroPorCliente = todosContratos
                .GroupBy(c => c.ClienteId)
                .Select(g => g.First().Id)
                .ToHashSet();

            foreach (var contratoId in primeiroPorCliente)
            {
                var p4 = await db.Parcelas.FirstOrDefaultAsync(
                    x => x.ContratoId == contratoId && x.NumeroParcela == 4, ct);

                if (p4 != null && p4.Status == InstallmentStatus.A_VENCER)
                {
                    p4.Status = InstallmentStatus.AGUARDANDO_APROVACAO;
                    await db.SaveChangesAsync(ct);
                }
            }
        }

        private static Contrato CorrigirNulos(Contrato c)
        {
            c.NomeContrato  ??= $"CONTRATO_{c.ClienteId}_{DateTime.UtcNow.Ticks}";
            return c;
        }
    }
}
