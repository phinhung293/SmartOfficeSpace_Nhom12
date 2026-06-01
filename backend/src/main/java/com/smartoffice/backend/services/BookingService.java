package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.booking.BookingRequest;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.booking.SlotStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface BookingService {

    /**
     * Tạo booking mới với collision check chặt (pessimistic lock).
     * Trả về booking ở trạng thái PENDING_PAYMENT (lock 5 phút).
     */
    BookingResponse createBooking(BookingRequest request, Integer userId);

    /**
     * Lấy trạng thái slot trong ngày cho phòng (booked / locked / maintenance).
     */
    SlotStatusResponse getSlotStatus(Integer roomId, LocalDate date);

    /**
     * Lịch sử booking của user.
     */
    Page<BookingResponse> getMyBookings(Integer userId, Pageable pageable);

    /**
     * Admin: toàn bộ booking, có filter.
     */
    Page<BookingResponse> getAllBookings(String status, LocalDate dateFrom, LocalDate dateTo,
                                         String userKeyword, String roomKeyword, String bookingCode,
                                         Pageable pageable);

    /**
     * Admin hủy booking.
     */
    BookingResponse cancelBooking(Integer bookingId);

    /**
     * Admin xác nhận thanh toán.
     */
    BookingResponse confirmPayment(Integer bookingId);
    /**
     * Đếm số đơn trong ngày (admin dashboard).
     */
    long countTodayBookings(java.time.LocalDateTime dayStart, java.time.LocalDateTime dayEnd);

    /**
     * Tính doanh thu hôm nay từ các đơn CONFIRMED (admin dashboard).
     */
    java.math.BigDecimal getTodayRevenue(java.time.LocalDateTime dayStart, java.time.LocalDateTime dayEnd);

    BookingResponse getMyBookingById(Integer bookingId, Integer userId);

    BookingResponse cancelMyBooking(Integer bookingId, Integer userId);

}