package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyReportDTO {
    private int totalRooms;
    private int occupiedRooms;
    private BigDecimal occupancyRate;           // %
    private List<RoomOccupancyDTO> roomDetails;
}