package com.smartoffice.backend.dto.booking;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Integer bookingId;
    private String bookingCode;
    private String userName;
    private String userEmail;
    private String roomName;
    private String roomImageUrl;
    private String workspaceType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private Long durationHours;
    private String userPhone;
    private BigDecimal pricePerHour;
    private Integer capacity;
}