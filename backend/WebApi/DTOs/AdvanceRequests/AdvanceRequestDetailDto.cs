using System;
using System.Collections.Generic;
using WebApi.Models;

namespace WebApi.DTOs.AdvanceRequests
{
    public class AdvanceRequestDetailDto
    {
        public int Id { get; set; }

        public int ClienteId { get; set; }

        public int ContratoId { get; set; }

        public AdvanceRequestStatus Status { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public List<AdvanceRequestItemDto> Items { get; set; } = new();
    }
}
