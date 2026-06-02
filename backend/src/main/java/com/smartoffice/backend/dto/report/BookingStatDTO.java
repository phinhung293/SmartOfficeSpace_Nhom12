package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatDTO {
    private String period;
    private Long totalBookings;
    private Long confirmedBookings;
    private Long cancelledBookings;
    private Long pendingBookings;
}