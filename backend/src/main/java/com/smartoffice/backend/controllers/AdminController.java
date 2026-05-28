package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.admin.AdminAddUserRequest;
import com.smartoffice.backend.dto.admin.AdminUpdateUserRequest;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.room.RoomUpdateRequest;
import com.smartoffice.backend.dto.room.RoomResponse;
import com.smartoffice.backend.entities.Room;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.entities.RoomStatus;
import com.smartoffice.backend.entities.WorkspaceType;
import com.smartoffice.backend.repositories.*;
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
    private final BookingStatusRepository bookingStatusRepository;
    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final BookingRepository bookingRepository;
    private final RoomStatusRepository roomStatusRepository;
    private final WorkspaceTypeRepository workspaceTypeRepository;
    private final AmenityRepository amenityRepository;

    // ─── USERS (Gộp đầy đủ tính năng CRUD của cả 2 nhánh) ───────────────────────

    @GetMapping("/users")
    public ApiResponse<List<User>> getUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            return ApiResponse.success(userRepository.findByRole_RoleName(role));
        }
        return ApiResponse.success(userService.getAllUsers());
    }

    @PostMapping("/users")
    public ApiResponse<?> addUser(@RequestBody AdminAddUserRequest req) {
        userService.addUser(req.getName(), req.getEmail(), req.getPhone(), req.getStatus());
        return ApiResponse.success("Thêm người dùng mới thành công!");
    }

    @PutMapping("/users/{id}")
    public ApiResponse<?> updateUser(@PathVariable Integer id, @RequestBody AdminUpdateUserRequest req) {
        userService.updateUserInfo(id, req.getName(), req.getPhone(), req.getStatus());
        return ApiResponse.success("Cập nhật thông tin người dùng thành công!");
    }

    @PutMapping("/users/{id}/toggle")
    public ApiResponse<?> toggleStatus(@PathVariable Integer id) {
        userService.toggleUserStatus(id);
        return ApiResponse.success("Cập nhật trạng thái thành công!");
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<?> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ApiResponse.success("Xóa người dùng thành công!");
    }

    // ─── ROOMS (Điều phối không gian - Nhánh booking) ─────────────────────────

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

    @PostMapping("/rooms")
    public ApiResponse<RoomResponse> createRoom(@RequestBody RoomUpdateRequest request) {
        Room room = new Room();
        if (request.getName() == null || request.getName().isBlank())
            throw new RuntimeException("Tên phòng không được để trống.");
        room.setName(request.getName());
        room.setCapacity(request.getCapacity() != null ? request.getCapacity() : 1);
        room.setPrice(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO);
        room.setDescription(request.getDescription());
        room.setLocation(request.getLocation());
        room.setImageUrl(request.getImageUrl());

        if (request.getWorkspaceType() != null && !request.getWorkspaceType().isBlank()) {
            WorkspaceType wt = workspaceTypeRepository.findAll().stream()
                    .filter(t -> t.getTypeName().equalsIgnoreCase(request.getWorkspaceType()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Loại không gian không hợp lệ: " + request.getWorkspaceType()));
            room.setWorkspaceType(wt);
        } else {
            workspaceTypeRepository.findAll().stream().findFirst().ifPresent(room::setWorkspaceType);
        }

        String statusName = (request.getRoomStatus() != null && !request.getRoomStatus().isBlank())
                ? request.getRoomStatus() : "Còn trống";
        RoomStatus rs = roomStatusRepository.findAll().stream()
                .filter(s -> s.getStatusName().equalsIgnoreCase(statusName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Trạng thái không hợp lệ: " + statusName));
        room.setRoomStatus(rs);

        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            List<com.smartoffice.backend.entities.Amenity> allAmenities = amenityRepository.findAll();
            List<com.smartoffice.backend.entities.Amenity> selected = allAmenities.stream()
                    .filter(a -> request.getAmenities().contains(a.getName()))
                    .collect(java.util.stream.Collectors.toList());
            room.setAmenities(selected);
        }

        Room saved = roomRepository.save(room);
        return ApiResponse.success(roomService.getRoomDetailResponse(saved.getRoomId()));
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

        if (request.getWorkspaceType() != null && !request.getWorkspaceType().isBlank()) {
            WorkspaceType wt = workspaceTypeRepository.findAll().stream()
                    .filter(t -> t.getTypeName().equalsIgnoreCase(request.getWorkspaceType()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Loại không gian không hợp lệ: " + request.getWorkspaceType()));
            room.setWorkspaceType(wt);
        }

        if (request.getRoomStatus() != null && !request.getRoomStatus().isBlank()) {
            RoomStatus rs = roomStatusRepository.findAll().stream()
                    .filter(s -> s.getStatusName().equalsIgnoreCase(request.getRoomStatus()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Trạng thái phòng không hợp lệ: " + request.getRoomStatus()));
            room.setRoomStatus(rs);
        }

        if (request.getAmenities() != null) {
            List<com.smartoffice.backend.entities.Amenity> allAmenities = amenityRepository.findAll();
            List<com.smartoffice.backend.entities.Amenity> selected = allAmenities.stream()
                    .filter(a -> request.getAmenities().contains(a.getName()))
                    .collect(java.util.stream.Collectors.toList());
            room.setAmenities(selected);
        }

        roomRepository.save(room);
        return ApiResponse.success(roomService.getRoomDetailResponse(id));
    }

    // ─── BOOKINGS (Điều phối lịch đặt phòng - Nhánh booking) ───────────────────

    @GetMapping("/bookings")
    public ApiResponse<Page<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String userKeyword,
            @RequestParam(required = false) String roomKeyword,
            @RequestParam(required = false) String bookingCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<BookingResponse> result = bookingService.getAllBookings(
                status, dateFrom, dateTo, userKeyword, roomKeyword, bookingCode,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.success(result);
    }

    @PutMapping("/bookings/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable Integer id) {
        return ApiResponse.success(bookingService.cancelBooking(id));
    }

    @PutMapping("/bookings/{id}")
    public ApiResponse<BookingResponse> updateBooking(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body
    ) {
        com.smartoffice.backend.entities.Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + id));

        if (body.containsKey("startTime") && body.get("startTime") != null) {
            booking.setStartTime(LocalDateTime.parse(body.get("startTime")));
        }
        if (body.containsKey("endTime") && body.get("endTime") != null) {
            booking.setEndTime(LocalDateTime.parse(body.get("endTime")));
        }

        if (booking.getStartTime() != null && booking.getEndTime() != null) {
            if (!booking.getEndTime().isAfter(booking.getStartTime())) {
                throw new RuntimeException("Giờ kết thúc phải sau giờ bắt đầu.");
            }
            boolean hasConflict = bookingRepository.hasOverlappingExcludeSelf(
                    booking.getRoom().getRoomId(),
                    booking.getBookingId(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );
            if (hasConflict) {
                List<com.smartoffice.backend.entities.Booking> conflicts =
                        bookingRepository.findAllOverlappingExcludeSelf(
                                booking.getRoom().getRoomId(),
                                booking.getBookingId(),
                                booking.getStartTime(),
                                booking.getEndTime()
                        );
                String names = conflicts.stream()
                        .map(b -> b.getUser().getName()
                                + " (" + b.getStartTime().toLocalTime().toString().substring(0,5)
                                + "–" + b.getEndTime().toLocalTime().toString().substring(0,5) + ")")
                        .collect(java.util.stream.Collectors.joining(", "));
                throw new RuntimeException(
                        "Khung giờ bị trùng với đơn của: " + names + ". Vui lòng chọn giờ khác."
                );
            }
        }

        if (booking.getStartTime() != null && booking.getEndTime() != null && booking.getRoom() != null) {
            long hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toHours();
            if (hours > 0) {
                booking.setTotalAmount(booking.getRoom().getPrice().multiply(java.math.BigDecimal.valueOf(hours)));
            }
        }

        bookingRepository.save(booking);

        BookingResponse resp = new BookingResponse();
        resp.setBookingId(booking.getBookingId());
        resp.setBookingCode(booking.getBookingCode());
        resp.setStartTime(booking.getStartTime());
        resp.setEndTime(booking.getEndTime());
        resp.setTotalAmount(booking.getTotalAmount());
        resp.setStatus(booking.getBookingStatus().getStatusName());
        if (booking.getUser() != null) resp.setUserName(booking.getUser().getName());
        if (booking.getRoom() != null) resp.setRoomName(booking.getRoom().getName());
        return ApiResponse.success(resp);
    }

    @PutMapping("/bookings/{id}/confirm")
    public ApiResponse<BookingResponse> confirmBooking(@PathVariable Integer id) {
        return ApiResponse.success(bookingService.confirmPayment(id));
    }

    @PutMapping("/bookings/{id}/revert-pending")
    public ApiResponse<BookingResponse> revertToPending(@PathVariable Integer id) {
        com.smartoffice.backend.entities.Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + id));
        if (!"CONFIRMED".equals(booking.getBookingStatus().getStatusName())) {
            throw new RuntimeException("Chỉ có thể hoàn đơn đã xác nhận về chờ thanh toán.");
        }
        com.smartoffice.backend.entities.BookingStatus pendingStatus =
                bookingStatusRepository.findAll().stream()
                        .filter(s -> "PENDING_PAYMENT".equals(s.getStatusName()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy trạng thái PENDING_PAYMENT"));
        booking.setBookingStatus(pendingStatus);
        booking.setLockedUntil(java.time.LocalDateTime.now().plusMinutes(30));
        bookingRepository.save(booking);

        BookingResponse resp = new BookingResponse();
        resp.setBookingId(booking.getBookingId());
        resp.setBookingCode(booking.getBookingCode());
        resp.setStartTime(booking.getStartTime());
        resp.setEndTime(booking.getEndTime());
        resp.setTotalAmount(booking.getTotalAmount());
        resp.setStatus("PENDING_PAYMENT");
        if (booking.getUser() != null) resp.setUserName(booking.getUser().getName());
        if (booking.getRoom() != null) resp.setRoomName(booking.getRoom().getName());
        return ApiResponse.success(resp);
    }

    // ─── DASHBOARD (Số liệu thống kê realtime - Nhánh booking) ───────────────────

    @GetMapping("/dashboard/don-hom-nay")
    public ApiResponse<Page<BookingResponse>> getDonHomNay(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        LocalDate today = LocalDate.now();
        Page<BookingResponse> result = bookingService.getAllBookings(
                null, today, today, null, null, null,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.success(result);
    }

    @GetMapping("/dashboard/tinh-trang-phong")
    public ApiResponse<List<RoomResponse>> getTinhTrangPhong() {
        List<RoomResponse> rooms = roomRepository.findAll().stream()
                .map(room -> {
                    RoomResponse r = roomService.getRoomDetailResponse(room.getRoomId());
                    String realtimeStatus = roomService.getRealtimeStatus(room.getRoomId());
                    r.setRoomStatus(realtimeStatus);
                    return r;
                })
                .collect(java.util.stream.Collectors.toList());
        return ApiResponse.success(rooms);
    }

    @GetMapping("/dashboard/tong-quan")
    public ApiResponse<Map<String, Object>> getTongQuan() {
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        LocalDateTime dayEnd   = dayStart.plusDays(1);

        long tongNguoiDung  = userRepository.count();
        long donHomNay      = bookingRepository.countTodayBookings(dayStart, dayEnd);
        long tongPhong      = roomRepository.count();

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
