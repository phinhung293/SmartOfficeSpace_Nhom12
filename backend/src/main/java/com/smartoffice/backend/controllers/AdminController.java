package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.request.RoomUpdateRequest;
import com.smartoffice.backend.dto.response.RoomResponse;
import com.smartoffice.backend.entities.Room;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.RoomRepository;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.BookingService;
import com.smartoffice.backend.services.RoomService;
import com.smartoffice.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final BookingService bookingService;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final RoomService roomService;

    // ─── USERS ────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ApiResponse<List<User>> getUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            return ApiResponse.success(userRepository.findByRole_RoleName(role));
        }
        return ApiResponse.success(userService.getAllUsers());
    }

    @PutMapping("/users/{id}/toggle")
    public ApiResponse<String> toggleStatus(@PathVariable Integer id) {
        userService.toggleUserStatus(id);
        return ApiResponse.success("Cập nhật trạng thái thành công");
    }

    // ─── ROOMS (Điều phối không gian) ─────────────────────────────────────────

    @GetMapping("/rooms")
    public ApiResponse<List<RoomResponse>> getAllRooms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer typeId
    ) {
        List<RoomResponse> rooms = roomRepository.findAll().stream()
                .map(room -> roomService.getRoomDetailResponse(room.getRoomId()))
                .collect(java.util.stream.Collectors.toList());
        return ApiResponse.success(rooms);
    }

    @PutMapping("/rooms/{id}")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable Integer id,
            @RequestBody RoomUpdateRequest request
    ) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại: " + id));
        if (request.getName() != null)        room.setName(request.getName());
        if (request.getCapacity() != null)    room.setCapacity(request.getCapacity());
        if (request.getPrice() != null)       room.setPrice(request.getPrice());
        if (request.getDescription() != null) room.setDescription(request.getDescription());
        if (request.getLocation() != null)    room.setLocation(request.getLocation());
        if (request.getImageUrl() != null)    room.setImageUrl(request.getImageUrl());
        roomRepository.save(room);
        return ApiResponse.success(roomService.getRoomDetailResponse(id));
    }

    // ─── BOOKINGS ─────────────────────────────────────────────────────────────

    @GetMapping("/bookings")
    public ApiResponse<Page<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String userKeyword,
            @RequestParam(required = false) String roomKeyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<BookingResponse> result = bookingService.getAllBookings(
                status, date, userKeyword, roomKeyword,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.success(result);
    }

    @PutMapping("/bookings/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable Integer id) {
        return ApiResponse.success(bookingService.cancelBooking(id));
    }

    @PutMapping("/bookings/{id}/confirm")
    public ApiResponse<BookingResponse> confirmBooking(@PathVariable Integer id) {
        return ApiResponse.success(bookingService.confirmPayment(id));
    }

    // ─── DASHBOARD: Đơn đặt phòng hôm nay ────────────────────────────────────
    // GET /api/admin/dashboard/don-hom-nay

    @GetMapping("/dashboard/don-hom-nay")
    public ApiResponse<Page<BookingResponse>> getDonHomNay(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        LocalDate today = LocalDate.now();
        Page<BookingResponse> result = bookingService.getAllBookings(
                null, today, null, null,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.success(result);
    }

    // ─── DASHBOARD: Tình trạng phòng hiện tại ─────────────────────────────────
    // GET /api/admin/dashboard/tinh-trang-phong

    @GetMapping("/dashboard/tinh-trang-phong")
    public ApiResponse<List<RoomResponse>> getTinhTrangPhong() {
        List<RoomResponse> rooms = roomRepository.findAll().stream()
                .map(room -> roomService.getRoomDetailResponse(room.getRoomId()))
                .collect(java.util.stream.Collectors.toList());
        return ApiResponse.success(rooms);
    }

    // ─── DASHBOARD: Số liệu thống kê tổng quan ────────────────────────────────
    // GET /api/admin/dashboard/tong-quan

    @GetMapping("/dashboard/tong-quan")
    public ApiResponse<Map<String, Object>> getTongQuan() {
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        LocalDateTime dayEnd   = dayStart.plusDays(1);

        long tongNguoiDung  = userRepository.count();
        long donHomNay      = bookingRepository.countTodayBookings(dayStart, dayEnd);
        long tongPhong      = roomRepository.count();

        // Doanh thu hôm nay: tổng tiền các booking CONFIRMED hôm nay
        java.math.BigDecimal doanhThuHomNay = bookingRepository
                .sumConfirmedAmountToday(dayStart, dayEnd)
                .orElse(java.math.BigDecimal.ZERO);

        return ApiResponse.success(Map.of(
                "tongNguoiDung",  tongNguoiDung,
                "donHomNay",      donHomNay,
                "tongPhong",      tongPhong,
                "doanhThuHomNay", doanhThuHomNay
        ));
    }
}