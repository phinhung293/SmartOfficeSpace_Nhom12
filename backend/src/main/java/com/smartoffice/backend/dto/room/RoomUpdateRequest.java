package com.smartoffice.backend.dto.room;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RoomUpdateRequest {
    private String name;
    private Integer capacity;
    private BigDecimal price;
    private String description;
    private String location;
    private String imageUrl;
    private String workspaceType;   // "Phòng họp", "Phòng làm việc", "Coworking"
    private String roomStatus;      // "Còn trống", "Đang bận", "Bảo trì"
    private List<String> amenities; // danh sách tên tiện ích
}
