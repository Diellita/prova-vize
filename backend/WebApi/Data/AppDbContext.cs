using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Contrato> Contratos => Set<Contrato>();
        public DbSet<Parcela> Parcelas => Set<Parcela>();
        public DbSet<Cliente> Clientes => Set<Cliente>();
        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<AdvanceRequest> AdvanceRequests => Set<AdvanceRequest>();
        public DbSet<AdvanceRequestItem> AdvanceRequestItems => Set<AdvanceRequestItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Contrato → tblcontrato
            modelBuilder.Entity<Contrato>(entity =>
            {
                entity.ToTable("tblcontrato");

                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("idcontrato");

                entity.Property(e => e.NomeContrato)
                      .IsRequired()
                      .HasMaxLength(200)
                      .HasColumnName("nomecontrato");

                entity.Property(e => e.ClienteId)
                      .IsRequired()
                      .HasColumnName("clienteid");

                entity.Property(e => e.Status)
                      .IsRequired()
                      .HasColumnName("status");

                entity.Property(e => e.VencimentoContrato)
                      .IsRequired()
                      .HasColumnName("vencimentocontrato");

                entity.Property(e => e.DataAlteracao)
                      .IsRequired()
                      .HasColumnName("dataalteracao");

                entity.Property(e => e.DataInsercao)
                      .IsRequired()
                      .HasColumnName("datainsercao");

                entity.Property(e => e.NumeroParcelas)
                      .IsRequired()
                      .HasColumnName("numeroparcelas");

                // FK contrato → cliente
                entity.HasOne(e => e.Cliente)
                      .WithMany()
                      .HasForeignKey(e => e.ClienteId)
                      .OnDelete(DeleteBehavior.Restrict);

                // contrato → parcelas
                entity.HasMany(e => e.Parcelas)
                      .WithOne(p => p.Contrato)
                      .HasForeignKey(p => p.ContratoId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Parcela → tblparcelas
            modelBuilder.Entity<Parcela>(entity =>
            {
                entity.ToTable("tblparcelas");

                entity.HasKey(p => p.Id);
                entity.Property(p => p.Id).HasColumnName("idparcela");

                entity.Property(p => p.ContratoId)
                      .IsRequired()
                      .HasColumnName("contratoid");

                entity.Property(p => p.NumeroParcela)
                      .IsRequired()
                      .HasColumnName("numeroparcela");

                entity.Property(p => p.Valor)
                      .HasColumnType("numeric(18,2)")
                      .IsRequired()
                      .HasColumnName("valor");

                entity.Property(p => p.Vencimento)
                      .IsRequired()
                      .HasColumnName("vencimento");

                entity.Property(p => p.Status)
                      .IsRequired()
                      .HasColumnName("status");

                entity.Property(p => p.ClienteId)
                      .IsRequired()
                      .HasColumnName("clienteid");

                // FK parcela → cliente
                entity.HasOne(p => p.Cliente)
                      .WithMany()
                      .HasForeignKey(p => p.ClienteId)
                      .OnDelete(DeleteBehavior.Restrict);

                // FK parcela → contrato
                entity.HasOne(p => p.Contrato)
                      .WithMany(c => c.Parcelas)
                      .HasForeignKey(p => p.ContratoId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Cliente → tblcliente
            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.ToTable("tblcliente");

                entity.HasKey(c => c.Id);
                entity.Property(c => c.Id).HasColumnName("idcliente");

                entity.Property(c => c.Nome)
                      .IsRequired()
                      .HasMaxLength(200)
                      .HasColumnName("nome");

                entity.Property(c => c.Email)
                      .IsRequired()
                      .HasMaxLength(200)
                      .HasColumnName("email");

                entity.Property(c => c.Senha)
                      .IsRequired()
                      .HasMaxLength(200)
                      .HasColumnName("senha");

                entity.Property(c => c.UsuarioId)
                      .IsRequired()
                      .HasColumnName("usuarioid");

                // FK cliente → usuario
                entity.HasOne(c => c.Usuario)
                      .WithOne(u => u.Cliente)
                      .HasForeignKey<Cliente>(c => c.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);

                // índice único para email
                entity.HasIndex(c => c.Email).IsUnique();
            });

            // Usuario → tblusuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.ToTable("tblusuario");

                entity.HasKey(u => u.Id);
                entity.Property(u => u.Id).HasColumnName("idusuario");

                entity.Property(u => u.TipoUsuario)
                      .IsRequired()
                      .HasConversion<int>()
                      .HasColumnName("tipousuario");

                // relação 1:1 com Cliente (FK está no Cliente)
                entity.HasOne(u => u.Cliente)
                      .WithOne(c => c.Usuario)
                      .HasForeignKey<Cliente>(c => c.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // AdvanceRequest → tbladvancerequest
            modelBuilder.Entity<AdvanceRequest>(entity =>
            {
                entity.ToTable("tbladvancerequest");

                entity.HasKey(a => a.Id);
                entity.Property(a => a.Id).HasColumnName("idadvancerequest");

                entity.Property(a => a.ClienteId)
                      .IsRequired()
                      .HasColumnName("clienteid");

                entity.Property(a => a.ContratoId)
                      .IsRequired()
                      .HasColumnName("contratoid");

                entity.Property(a => a.Status)
                      .IsRequired()
                      .HasConversion<int>()
                      .HasColumnName("status");

                entity.Property(a => a.Notes)
                      .HasMaxLength(1000)
                      .HasColumnName("notes");

                entity.Property(a => a.CreatedAt)
                      .IsRequired()
                      .HasColumnName("createdat");

                entity.Property(a => a.ApprovedAt)
                      .HasColumnName("approvedat");

                // FKs
                entity.HasOne(a => a.Cliente)
                      .WithMany()
                      .HasForeignKey(a => a.ClienteId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Contrato)
                    .WithMany()
                    .HasForeignKey(a => a.ContratoId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relacionamento com itens
                entity.HasMany(a => a.Items)
                      .WithOne(i => i.AdvanceRequest)
                      .HasForeignKey(i => i.AdvanceRequestId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // AdvanceRequestItem → tbladvancerequestitem
            modelBuilder.Entity<AdvanceRequestItem>(entity =>
            {
                entity.ToTable("tbladvancerequestitem");

                entity.HasKey(i => i.Id);
                entity.Property(i => i.Id).HasColumnName("idadvancerequestitem");

                entity.Property(i => i.AdvanceRequestId)
                      .IsRequired()
                      .HasColumnName("advancerequestid");

                entity.Property(i => i.ParcelaId)
                      .IsRequired()
                      .HasColumnName("parcelaid");

                entity.Property(i => i.ValorNaSolicitacao)
                      .HasColumnType("numeric(18,2)")
                      .HasColumnName("valornasolicitacao");

                // FKs
                entity.HasOne(i => i.AdvanceRequest)
                      .WithMany(a => a.Items)
                      .HasForeignKey(i => i.AdvanceRequestId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(i => i.Parcela)
                      .WithMany()
                      .HasForeignKey(i => i.ParcelaId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
