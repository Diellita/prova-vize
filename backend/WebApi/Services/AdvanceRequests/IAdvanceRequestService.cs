using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WebApi.DTOs.AdvanceRequests;
using WebApi.Models;

namespace WebApi.Services.AdvanceRequests
{
    public interface IAdvanceRequestService
    {
        Task<AdvanceRequestDetailDto> CreateAsync(
            int contratoId,
            string? notes,
            string clientId,
            CancellationToken ct = default);

        Task<AdvanceRequestDetailDto?> GetByIdAsync(
            int id,
            string clientId,
            CancellationToken ct = default);

        Task<IEnumerable<AdvanceRequestDetailDto>> GetAdvanceRequestsAsync(
            string clientId,
            AdvanceRequestStatus? status,
            DateTime? startDate,
            DateTime? endDate,
            int page,
            int pageSize,
            CancellationToken ct = default);
    }
}
