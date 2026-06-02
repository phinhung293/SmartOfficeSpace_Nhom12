package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDetailDto {
    private String period; // YYYY-MM-DD, YYYY-MM, or YYYY
    private long bookingCount;
    private BigDecimal totalRevenue;
}
