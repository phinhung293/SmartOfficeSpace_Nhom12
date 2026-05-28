package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_booking_room_time", columnList = "RoomID, StartTime, EndTime")
})
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BookingID")
    private Integer bookingId;

    /** Mã đơn dạng WS{date}-{seq}, ví dụ: WS250519-001 */
    @Column(name = "BookingCode", unique = true, length = 30)
    private String bookingCode;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "RoomID", nullable = false)
    private Room room;

    @Column(name = "StartTime", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "EndTime", nullable = false)
    private LocalDateTime endTime;

    @ManyToOne
    @JoinColumn(name = "StatusID", nullable = false)
    private BookingStatus bookingStatus;

    /** Tổng tiền = price/hour * hours */
    @Column(name = "TotalAmount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Khi trạng thái là PENDING_PAYMENT,
     * slot sẽ được tự động mở lại (expire) sau thời điểm này.
     */
    @Column(name = "LockedUntil")
    private LocalDateTime lockedUntil;

    @Version
    @Column(name = "Version")
    private Long version;
}
