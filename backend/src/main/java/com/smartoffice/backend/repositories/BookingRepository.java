package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface BookingRepository
        extends JpaRepository<Booking, Integer> {

    boolean existsByRoom_RoomIdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            Integer roomId,
            LocalDateTime now1,
            LocalDateTime now2
    );
    @Query("""
        SELECT COUNT(b) > 0
        FROM Booking b
        WHERE b.room.roomId = :roomId
        AND b.startTime < :requestedEnd
        AND b.endTime > :requestedStart
    """)
    boolean hasOverlappingBooking(
            @Param("roomId") Integer roomId,
            @Param("requestedStart") LocalDateTime requestedStart,
            @Param("requestedEnd") LocalDateTime requestedEnd
    );
}