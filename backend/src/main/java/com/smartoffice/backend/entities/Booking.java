package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Bookings")
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BookingID")
    private Integer bookingId;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "RoomID", nullable = false)
    private Room room;

    @Column(name = "StartTime", nullable = false)
    private java.time.LocalDateTime startTime;

    @Column(name = "EndTime", nullable = false)
    private java.time.LocalDateTime endTime;

    @ManyToOne
    @JoinColumn(name = "StatusID", nullable = false)
    private BookingStatus bookingStatus;

    @Column(name = "CreatedAt")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
