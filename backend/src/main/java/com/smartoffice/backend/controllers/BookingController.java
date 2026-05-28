package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.booking.BookingRequest;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.booking.SlotStatusResponse;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
}
