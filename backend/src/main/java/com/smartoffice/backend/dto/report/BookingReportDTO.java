package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingReportDTO {
    private Long totalBookings;
    private Long pendingBookings;
    private Long confirmedBookings;
    private Long cancelledBookings;
    private Long completedBookings;
}