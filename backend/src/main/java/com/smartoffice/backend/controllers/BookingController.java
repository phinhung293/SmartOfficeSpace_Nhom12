package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.booking.BookingRequest;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.booking.SlotStatusResponse;
import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;


import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    /**
     * GET /api/bookings/slots?roomId=X&date=YYYY-MM-DD
     * Public — xem slot đã đặt (không cần đăng nhập)
     */
    @GetMapping("/slots")
    public ApiResponse<SlotStatusResponse> getSlotStatus(
            @RequestParam Integer roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ApiResponse.success(bookingService.getSlotStatus(roomId, date));
    }

    /**
     * POST /api/bookings
     * Tạo booking mới — yêu cầu đăng nhập
     */
    @PostMapping
    public ApiResponse<BookingResponse> createBooking(
            @RequestBody BookingRequest request,
            Principal principal
    ) {
        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập để đặt phòng.");
        }
        String email = principal.getName();
        Integer userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + email))
                .getUserId();
        return ApiResponse.success(bookingService.createBooking(request, userId));
    }

    /**
     * GET /api/bookings/my-bookings?page=0&size=10
     * Lịch sử đặt phòng của user hiện tại — yêu cầu đăng nhập
     */
    @GetMapping("/my-bookings")
    public ApiResponse<Page<BookingResponse>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal
    ) {
        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập.");
        }
        String email = principal.getName();
        Integer userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + email))
                .getUserId();
        Page<BookingResponse> result = bookingService.getMyBookings(
                userId, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<Booking> getOne(@PathVariable Integer id) {
        return ApiResponse.success(bookingService.findById(id));
    }

    /**
     * GET /api/bookings/my-bookings/{id}
     * Lấy chi tiết booking của user hiện tại
     */
    @GetMapping("/my-bookings/{id}")
    public ApiResponse<BookingResponse> getMyBookingById(
            @PathVariable Integer id,
            Principal principal
    ) {
        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập.");
        }

        String email = principal.getName();

        Integer userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + email))
                .getUserId();

        BookingResponse result = bookingService.getMyBookingById(id, userId);

        return ApiResponse.success(result);
    }

    /**
     * PUT /api/bookings/{id}/cancel
     * User tự hủy booking của mình
     */
    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelMyBooking(
            @PathVariable Integer id,
            Principal principal
    ) {
        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập.");
        }

        String email = principal.getName();

        Integer userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"))
                .getUserId();

        BookingResponse result = bookingService.cancelMyBooking(id, userId);

        return ApiResponse.success(result);
    }
}
