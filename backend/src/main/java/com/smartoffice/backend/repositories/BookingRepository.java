package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.entities.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Integer>, JpaSpecificationExecutor<Booking> {

    /* ─── Kiểm tra overlap (dùng khi load slot status) ─── */
    @Query("""
        SELECT COUNT(b) > 0
        FROM Booking b
        WHERE b.room.roomId = :roomId
          AND b.startTime < :requestedEnd
          AND b.endTime > :requestedStart
          AND b.bookingStatus.statusName NOT IN ('CANCELLED', 'EXPIRED')
    """)
    boolean hasOverlappingBooking(
            @Param("roomId") Integer roomId,
            @Param("requestedStart") LocalDateTime requestedStart,
            @Param("requestedEnd") LocalDateTime requestedEnd
    );

    /* ─── Kiểm tra overlap với PESSIMISTIC LOCK (dùng khi tạo booking) ─── */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.room.roomId = :roomId
          AND b.startTime < :requestedEnd
          AND b.endTime > :requestedStart
          AND b.bookingStatus.statusName NOT IN ('CANCELLED', 'EXPIRED')
    """)
    List<Booking> findOverlappingWithLock(
            @Param("roomId") Integer roomId,
            @Param("requestedStart") LocalDateTime requestedStart,
            @Param("requestedEnd") LocalDateTime requestedEnd
    );

    /* ─── Realtime status (đang trong slot hiện tại) ─── */
    boolean existsByRoom_RoomIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            Integer roomId, LocalDateTime now1, LocalDateTime now2
    );

    /* ─── My Bookings (user xem lịch sử của mình) ─── */
    Page<Booking> findByUser_UserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    /* ─── Expire các booking PENDING_PAYMENT đã hết thời gian giữ chỗ ─── */
    @Modifying
    @Query("""
        UPDATE Booking b
        SET b.bookingStatus = :expiredStatus
        WHERE b.bookingStatus.statusName = 'PENDING_PAYMENT'
          AND b.lockedUntil < :now
    """)
    int expireStaleBookings(
            @Param("now") LocalDateTime now,
            @Param("expiredStatus") BookingStatus expiredStatus
    );

    /* ─── Lấy các slot đã booked trong ngày (để tính slot index cho FE) ─── */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.room.roomId = :roomId
          AND b.startTime >= :dayStart
          AND b.endTime <= :dayEnd
          AND b.bookingStatus.statusName NOT IN ('CANCELLED', 'EXPIRED')
    """)
    List<Booking> findBookingsForDay(
            @Param("roomId") Integer roomId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd
    );

    /* ─── Admin dashboard: đếm booking hôm nay ─── */
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.startTime >= :dayStart AND b.startTime < :dayEnd
    """)
    long countTodayBookings(@Param("dayStart") LocalDateTime dayStart, @Param("dayEnd") LocalDateTime dayEnd);

    /* ─── Admin dashboard: doanh thu booking CONFIRMED hôm nay ─── */
    @Query("""
        SELECT SUM(b.totalAmount) FROM Booking b
        WHERE b.bookingStatus.statusName = 'CONFIRMED'
          AND b.startTime >= :dayStart AND b.startTime < :dayEnd
    """)
    Optional<java.math.BigDecimal> sumConfirmedAmountToday(
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd
    );

    /* ─── Đếm theo BookingCode prefix để tạo sequence ─── */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingCode LIKE :prefix%")
    long countByBookingCodePrefix(@Param("prefix") String prefix);
}