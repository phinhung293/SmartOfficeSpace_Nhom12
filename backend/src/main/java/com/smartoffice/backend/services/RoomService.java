package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.room.RoomSearchRequest;
import com.smartoffice.backend.dto.room.RoomResponse;
import com.smartoffice.backend.entities.Room;
import org.springframework.data.domain.Page;

public interface RoomService {

    Page<RoomResponse> searchRooms(RoomSearchRequest request);
    Room getRoomDetail(Integer roomId);
    String getRealtimeStatus(Integer roomId);
    RoomResponse getRoomDetailResponse(Integer roomId);
}