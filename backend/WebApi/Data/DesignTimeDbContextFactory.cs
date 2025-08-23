using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WebApi.Data
{
    // Permite ao 'dotnet ef' criar o AppDbContext em tempo de design (migrations/update)
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

            // use a mesma connection string do appsettings.json
            var conn = "Host=localhost;Port=5432;Database=vize;Username=postgres;Password=postgres";
            optionsBuilder.UseNpgsql(conn);

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
