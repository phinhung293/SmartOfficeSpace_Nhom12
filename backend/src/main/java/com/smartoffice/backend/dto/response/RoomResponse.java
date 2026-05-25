package com.smartoffice.backend.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
public class RoomResponse {

    private Integer roomId;

    private String name;

    private String description;

    private Integer capacity;

    private BigDecimal price;

    private String workspaceType;

    private String roomStatus;

    private String location;

    private LocalTime openTime;

    private LocalTime closeTime;

    private List<String> amenities;

    // URL ảnh (có thể null nếu chưa có)
    private String imageUrl;
}