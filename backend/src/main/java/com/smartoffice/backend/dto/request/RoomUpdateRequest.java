package com.smartoffice.backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomUpdateRequest {
    private String name;
    private Integer capacity;
    private BigDecimal price;
    private String description;
    private String location;
    private String imageUrl;
}
