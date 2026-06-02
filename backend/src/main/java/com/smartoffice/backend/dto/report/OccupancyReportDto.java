package com.smartoffice.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyReportDto {
    private long totalRooms;
    private long occupiedRooms;
    private BigDecimal occupancyRate; // System occupancy rate (0-100)
    private List<RoomOccupancyDetailDto> roomDetails;
}
