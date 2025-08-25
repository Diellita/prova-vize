using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using WebApi.Models;

namespace WebApi.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            // só semeia se ainda estiver vazio
            if (context.Contracts.Any())
                return;

            var json = File.ReadAllText("Data/seed.json");
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new JsonStringEnumConverter() }
            };

            var contracts = JsonSerializer.Deserialize<List<Contract>>(json, options);
            if (contracts is null || contracts.Count == 0) return;

            // normaliza DueDate para UTC (exigência do Npgsql para timestamptz)
            foreach (var c in contracts)
            {
                foreach (var i in c.Installments)
                {
                    i.DueDate = DateTime.SpecifyKind(i.DueDate, DateTimeKind.Utc);
                }
            }

            context.Contracts.AddRange(contracts);
            context.SaveChanges();
        }
    }
}
