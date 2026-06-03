package com.smartoffice.backend.dto.room;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class RoomSearchRequest {

    // Sắp xếp theo field nào (price, capacity, name)
    private String sortBy;

    // Hướng sắp xếp: "asc" hoặc "desc" (mặc định "asc")
    private String sortDirection = "asc";

    // Tìm theo tên phòng
    private String keyword;

    // Giá tối thiểu
    private BigDecimal minPrice;

    // Giá tối đa
    private BigDecimal maxPrice;

    // Sức chứa tối thiểu
    private Integer capacity;

    // Loại phòng
    private Integer workspaceTypeId;

    // Trạng thái phòng
    private Integer statusId;

    // Danh sách tên tiện ích (frontend gửi label, backend filter theo tên)
    private List<String> amenityIds;

    // Pagination
    private Integer page = 0;

    private Integer size = 6;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
}