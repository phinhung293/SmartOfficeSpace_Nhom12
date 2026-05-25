package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.request.RoomSearchRequest;
import com.smartoffice.backend.dto.response.RoomResponse;
import com.smartoffice.backend.entities.Room;
import org.springframework.data.domain.Page;

public interface RoomService {

    Page<RoomResponse> searchRooms(RoomSearchRequest request);
    Room getRoomDetail(Integer roomId);
    String getRealtimeStatus(Integer roomId);
    RoomResponse getRoomDetailResponse(Integer roomId);
}