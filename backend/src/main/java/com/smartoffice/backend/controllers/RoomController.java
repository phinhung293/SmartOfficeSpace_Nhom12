package com.smartoffice.backend.controllers;

import com.smartoffice.backend.dto.room.RoomSearchRequest;
import com.smartoffice.backend.dto.room.RoomResponse;
import com.smartoffice.backend.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping("/search")
    public Page<RoomResponse> searchRooms(
            @RequestBody RoomSearchRequest request
    ) {

        return roomService.searchRooms(request);
    }
    @GetMapping("/{roomId}")
    public RoomResponse getRoomDetail(
            @PathVariable Integer roomId
    ) {

        return roomService.getRoomDetailResponse(roomId);
    }
    @GetMapping("/{roomId}/status")
    public String getRealtimeStatus(
            @PathVariable Integer roomId
    ) {

        return roomService.getRealtimeStatus(roomId);
    }
}