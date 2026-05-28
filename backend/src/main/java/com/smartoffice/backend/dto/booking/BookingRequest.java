package com.smartoffice.backend.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {

    @NotNull(message = "roomId không được để trống")
    private Integer roomId;

    @NotNull(message = "date không được để trống")
    private LocalDate date;

    @NotNull(message = "startTime không được để trống")
    private LocalTime startTime;

    @NotNull(message = "endTime không được để trống")
    private LocalTime endTime;
}
