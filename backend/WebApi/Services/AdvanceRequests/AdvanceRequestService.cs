using Microsoft.EntityFrameworkCore;
using System.Security;
using WebApi.Data;
using WebApi.DTOs.AdvanceRequests;
using WebApi.Models;

namespace WebApi.Services.AdvanceRequests
{
    public class AdvanceRequestService : IAdvanceRequestService
    {
        private readonly AppDbContext _db;

        public AdvanceRequestService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<AdvanceRequestDetailDto> CreateAsync(int contratoId, string? notes, string clientId, CancellationToken ct = default)
        {
            // valida cliente
            var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Id.ToString() == clientId, ct);
            if (cliente == null)
                throw new SecurityException("Cliente não encontrado.");

            // valida contrato
            var contrato = await _db.Contratos
                .Include(c => c.Parcelas)
                .FirstOrDefaultAsync(c => c.Id == contratoId && c.ClienteId == cliente.Id, ct);

            if (contrato == null)
                throw new KeyNotFoundException("Contrato não encontrado para este cliente.");

            var elegiveis = contrato.Parcelas
                .Where(p => p.Status == InstallmentStatus.A_VENCER && p.Vencimento >= DateTime.UtcNow.AddDays(30))
                .ToList();

            if (!elegiveis.Any())
                throw new InvalidOperationException("Nenhuma parcela elegível para antecipação.");

            var request = new AdvanceRequest
            {
                ClienteId = cliente.Id,
                ContratoId = contrato.Id,
                Notes = notes,
                CreatedAt = DateTime.UtcNow,
                Status = AdvanceRequestStatus.PENDENTE,
                Items = elegiveis.Select(p => new AdvanceRequestItem
                {
                    ParcelaId = p.Id,
                    ValorNaSolicitacao = p.Valor
                }).ToList()
            };

            // Atualiza parcelas para aguardando aprovação
            foreach (var p in elegiveis)
                p.Status = InstallmentStatus.AGUARDANDO_APROVACAO;

            _db.AdvanceRequests.Add(request);
            await _db.SaveChangesAsync(ct);

            return new AdvanceRequestDetailDto
            {
                Id = request.Id,
                ClienteId = request.ClienteId,
                ContratoId = request.ContratoId,
                Status = request.Status,
                Notes = request.Notes,
                CreatedAt = request.CreatedAt,
                ApprovedAt = request.ApprovedAt,
                Items = request.Items.Select(i => new AdvanceRequestItemDto
                {
                    ParcelaId = i.ParcelaId,
                    ValorNaSolicitacao = i.ValorNaSolicitacao ?? 0
                }).ToList()
            };
        }

        public async Task<AdvanceRequestDetailDto?> GetByIdAsync(int id, string clientId, CancellationToken ct = default)
        {
            var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Id.ToString() == clientId, ct);
            if (cliente == null)
                throw new SecurityException("Cliente não encontrado.");

            var request = await _db.AdvanceRequests
                .Include(r => r.Items)
                .ThenInclude(i => i.Parcela)
                .FirstOrDefaultAsync(r => r.Id == id && r.ClienteId == cliente.Id, ct);

            if (request == null)
                return null;

            return new AdvanceRequestDetailDto
            {
                Id = request.Id,
                ClienteId = request.ClienteId,
                ContratoId = request.ContratoId,
                Status = request.Status,
                Notes = request.Notes,
                CreatedAt = request.CreatedAt,
                ApprovedAt = request.ApprovedAt,
                Items = request.Items.Select(i => new AdvanceRequestItemDto
                {
                    ParcelaId = i.ParcelaId,
                    ValorNaSolicitacao = i.ValorNaSolicitacao ?? 0
                }).ToList()
            };
        }

        public async Task<IEnumerable<AdvanceRequestDetailDto>> GetAdvanceRequestsAsync(
            string clientId,
            AdvanceRequestStatus? status,
            DateTime? startDate,
            DateTime? endDate,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Id.ToString() == clientId, ct);
            if (cliente == null)
                throw new SecurityException("Cliente não encontrado.");

            var query = _db.AdvanceRequests
                .Include(r => r.Items)
                .ThenInclude(i => i.Parcela)
                .Where(r => r.ClienteId == cliente.Id)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);

            if (startDate.HasValue)
                query = query.Where(r => r.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(r => r.CreatedAt <= endDate.Value);

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return requests.Select(r => new AdvanceRequestDetailDto
            {
                Id = r.Id,
                ClienteId = r.ClienteId,
                ContratoId = r.ContratoId,
                Status = r.Status,
                Notes = r.Notes,
                CreatedAt = r.CreatedAt,
                ApprovedAt = r.ApprovedAt,
                Items = r.Items.Select(i => new AdvanceRequestItemDto
                {
                    ParcelaId = i.ParcelaId,
                    ValorNaSolicitacao = i.ValorNaSolicitacao ?? 0
                }).ToList()
            });
        }
    }
}
