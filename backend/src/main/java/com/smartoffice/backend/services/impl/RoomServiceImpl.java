package com.smartoffice.backend.services.impl;

import com.smartoffice.backend.dto.room.RoomSearchRequest;
import com.smartoffice.backend.dto.room.RoomResponse;
import com.smartoffice.backend.entities.Amenity;
import com.smartoffice.backend.entities.Room;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.RoomRepository;
import com.smartoffice.backend.services.RoomService;
import com.smartoffice.backend.specifications.RoomSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    @Override
    public Page<RoomResponse> searchRooms(RoomSearchRequest request) {

        // Build specification từ tất cả filter (search + bộ lọc đều đưa qua đây)
        Specification<Room> spec = Specification
                .where(RoomSpecification.hasKeyword(request.getKeyword()))
                .and(RoomSpecification.hasMinPrice(request.getMinPrice()))
                .and(RoomSpecification.hasMaxPrice(request.getMaxPrice()))
                .and(RoomSpecification.hasCapacity(request.getCapacity()))
                .and(RoomSpecification.hasWorkspaceType(request.getWorkspaceTypeId()))
                .and(RoomSpecification.hasStatus(request.getStatusId()))
                .and(RoomSpecification.hasAmenities(request.getAmenityIds()));

        // Build sort: mặc định theo price asc
        String sortField = (request.getSortBy() != null && !request.getSortBy().isBlank())
                ? request.getSortBy() : "price";
        boolean isDesc = "desc".equalsIgnoreCase(request.getSortDirection());
        Sort sort = isDesc ? Sort.by(sortField).descending() : Sort.by(sortField).ascending();

        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 6;
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        // Kiểm tra có filter thời gian không
        boolean hasTimeFilter = request.getDate() != null
                && request.getStartTime() != null
                && request.getEndTime() != null;

        if (!hasTimeFilter) {
            // Không có time filter → query DB trực tiếp với phân trang
            Page<Room> roomPage = roomRepository.findAll(spec, pageRequest);
            return roomPage.map(this::mapToRoomResponse);
        }

        // Có time filter → lấy tất cả theo spec, lọc overlap, rồi phân trang thủ công
        LocalDate bookingDate = request.getDate();
        LocalDateTime requestedStart = LocalDateTime.of(bookingDate, request.getStartTime());
        LocalDateTime requestedEnd   = LocalDateTime.of(bookingDate, request.getEndTime());

        List<RoomResponse> available = roomRepository.findAll(spec, sort).stream()
                .filter(room -> {
                    boolean hasOverlap = bookingRepository.hasOverlappingBooking(
                            room.getRoomId(), requestedStart, requestedEnd);
                    boolean isAvailable = room.getRoomStatus()
                            .getStatusName().equals("Còn trống");
                    return !hasOverlap && isAvailable;
                })
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());

        return paginate(available, pageRequest);
    }

    private Page<RoomResponse> paginate(List<RoomResponse> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        if (start >= list.size()) return new PageImpl<>(List.of(), pageable, list.size());
        int end = Math.min(start + pageable.getPageSize(), list.size());
        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }

    @Override
    public Room getRoomDetail(Integer roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
    }

    @Override
    public RoomResponse getRoomDetailResponse(Integer roomId) {
        return mapToRoomResponse(getRoomDetail(roomId));
    }

    @Override
    public String getRealtimeStatus(Integer roomId) {
        LocalDateTime now = LocalDateTime.now();
        boolean occupied = bookingRepository
                .existsByRoom_RoomIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(roomId, now, now);
        return occupied ? "Đang bận" : "Còn trống";
    }

    private RoomResponse mapToRoomResponse(Room room) {
        RoomResponse r = new RoomResponse();
        r.setRoomId(room.getRoomId());
        r.setName(room.getName());
        r.setDescription(room.getDescription());
        r.setCapacity(room.getCapacity());
        r.setPrice(room.getPrice());
        r.setLocation(room.getLocation());
        r.setOpenTime(room.getOpenTime());
        r.setCloseTime(room.getCloseTime());
        if (room.getWorkspaceType() != null) r.setWorkspaceType(room.getWorkspaceType().getTypeName());
        if (room.getRoomStatus() != null)    r.setRoomStatus(room.getRoomStatus().getStatusName());
        if (room.getAmenities() != null)
            r.setAmenities(room.getAmenities().stream().map(Amenity::getName).collect(Collectors.toList()));
        r.setImageUrl(room.getImageUrl());
        return r;
    }
}