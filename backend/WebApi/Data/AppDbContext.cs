using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Contract> Contracts => Set<Contract>();
        public DbSet<Installment> Installments => Set<Installment>();
        public DbSet<AdvanceRequest> AdvanceRequests => Set<AdvanceRequest>();
        public DbSet<AdvanceRequestItem> AdvanceRequestItems => Set<AdvanceRequestItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Contract
            modelBuilder.Entity<Contract>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.ContractId).IsUnique();
                e.Property(x => x.ContractId).IsRequired().HasMaxLength(50);
                e.Property(x => x.ClientId).IsRequired().HasMaxLength(50);
                e.Property(x => x.ClientName).IsRequired().HasMaxLength(200);

                e.HasMany(x => x.Installments)
                 .WithOne(i => i.Contract)
                 .HasForeignKey(i => i.ContractIdFk)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Installment
            modelBuilder.Entity<Installment>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.InstallmentId).IsUnique();
                e.Property(x => x.InstallmentId).IsRequired().HasMaxLength(50);
                e.Property(x => x.Amount).HasColumnType("numeric(18,2)");
                e.Property(x => x.Status).HasConversion<int>();
            });

            // AdvanceRequest
            modelBuilder.Entity<AdvanceRequest>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.RequestCode).IsUnique();
                e.Property(x => x.RequestCode).IsRequired().HasMaxLength(64);
                e.Property(x => x.ContractId).IsRequired().HasMaxLength(50);
                e.Property(x => x.RequestedByUserId).IsRequired().HasMaxLength(200);
                e.Property(x => x.Status).HasConversion<int>();
                e.HasMany(x => x.Items)
                 .WithOne(i => i.AdvanceRequest)
                 .HasForeignKey(i => i.AdvanceRequestId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // AdvanceRequestItem
            modelBuilder.Entity<AdvanceRequestItem>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.InstallmentId).IsRequired().HasMaxLength(50);
            });
        }
    }
}
