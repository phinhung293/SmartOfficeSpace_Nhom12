package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDetailDto {
    private String period; // YYYY-MM-DD
    private long bookingCount;
}
