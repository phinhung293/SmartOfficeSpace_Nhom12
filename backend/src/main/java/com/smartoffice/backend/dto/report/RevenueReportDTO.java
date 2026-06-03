package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueReportDTO {
    private String period;          // ngày / tháng / năm
    private BigDecimal totalRevenue;
    private Long bookingCount;
}