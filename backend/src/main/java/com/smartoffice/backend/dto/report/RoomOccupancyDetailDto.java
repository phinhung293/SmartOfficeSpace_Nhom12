package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomOccupancyDetailDto {
    private Integer roomId;
    private String roomName;
    private String roomType;
    private long bookingCount;
    private BigDecimal occupancyRate; // percentage of booked hours in the period
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE
}
