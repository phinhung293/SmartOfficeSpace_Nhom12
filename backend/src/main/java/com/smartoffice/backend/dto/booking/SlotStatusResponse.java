package com.smartoffice.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SlotStatusResponse {
    private List<Integer> booked;
    private List<Integer> maintenance;
    private List<Integer> locked;
}
