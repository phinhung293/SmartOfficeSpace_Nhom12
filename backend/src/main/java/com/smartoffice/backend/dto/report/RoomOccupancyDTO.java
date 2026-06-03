package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomOccupancyDTO {
    private Integer roomId;
    private String roomName;
    private String roomType;
    private Long bookingCount;
    private BigDecimal occupancyRate;  // %
    private String status;
}