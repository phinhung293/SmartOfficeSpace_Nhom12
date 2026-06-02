package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueReportDto {
    private BigDecimal totalRevenue;
    private long totalBookings;
    private List<RevenueDetailDto> details;
}
