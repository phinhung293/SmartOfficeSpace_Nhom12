package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository cung cấp các query thống kê cho module Report.
 * Không ghi đè BookingRepository hiện có — tách riêng để không phá cấu trúc cũ.
 */
@Repository
public interface ReportReponsitory extends JpaRepository<Booking, Integer> {

    // ─────────────────────────────────────────────
    // REVENUE: doanh thu theo ngày
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT DATE_FORMAT(b.StartTime, '%d/%m/%Y') AS period,
                   COALESCE(SUM(b.TotalAmount), 0)      AS totalRevenue,
                   COUNT(b.BookingID)                   AS bookingCount
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.StartTime BETWEEN :fromDate AND :toDate
              AND bs.StatusName = 'COMPLETED'
            GROUP BY DATE_FORMAT(b.StartTime, '%d/%m/%Y'), DATE(b.StartTime)
            ORDER BY DATE(b.StartTime)
            """, nativeQuery = true)
    List<Object[]> revenueByDay(@Param("fromDate") LocalDateTime fromDate,
                                @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // REVENUE: doanh thu theo tháng
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT DATE_FORMAT(b.StartTime, '%m/%Y')   AS period,
                   COALESCE(SUM(b.TotalAmount), 0)     AS totalRevenue,
                   COUNT(b.BookingID)                  AS bookingCount
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.StartTime BETWEEN :fromDate AND :toDate
              AND bs.StatusName = 'COMPLETED'
            GROUP BY DATE_FORMAT(b.StartTime, '%m/%Y'), YEAR(b.StartTime), MONTH(b.StartTime)
            ORDER BY YEAR(b.StartTime), MONTH(b.StartTime)
            """, nativeQuery = true)
    List<Object[]> revenueByMonth(@Param("fromDate") LocalDateTime fromDate,
                                  @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // REVENUE: doanh thu theo năm
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT YEAR(b.StartTime)                   AS period,
                   COALESCE(SUM(b.TotalAmount), 0)     AS totalRevenue,
                   COUNT(b.BookingID)                  AS bookingCount
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.StartTime BETWEEN :fromDate AND :toDate
              AND bs.StatusName = 'COMPLETED'
            GROUP BY YEAR(b.StartTime)
            ORDER BY YEAR(b.StartTime)
            """, nativeQuery = true)
    List<Object[]> revenueByYear(@Param("fromDate") LocalDateTime fromDate,
                                 @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // BOOKING STATS: tổng booking theo trạng thái
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT bs.StatusName,
                   COUNT(b.BookingID) AS cnt
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.CreatedAt BETWEEN :fromDate AND :toDate
            GROUP BY bs.StatusName
            """, nativeQuery = true)
    List<Object[]> bookingStatsByStatus(@Param("fromDate") LocalDateTime fromDate,
                                        @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // BOOKING STATS: theo ngày trong khoảng
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT DATE_FORMAT(b.CreatedAt, '%d/%m/%Y')              AS period,
                   COUNT(b.BookingID)                                 AS totalBookings,
                   SUM(CASE WHEN bs.StatusName = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
                   SUM(CASE WHEN bs.StatusName = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                   SUM(CASE WHEN bs.StatusName = 'PENDING'   THEN 1 ELSE 0 END) AS pending
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.CreatedAt BETWEEN :fromDate AND :toDate
            GROUP BY DATE_FORMAT(b.CreatedAt, '%d/%m/%Y'), DATE(b.CreatedAt)
            ORDER BY DATE(b.CreatedAt)
            """, nativeQuery = true)
    List<Object[]> bookingStatsByDay(@Param("fromDate") LocalDateTime fromDate,
                                     @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // OCCUPANCY: số booking đã confirmed theo phòng
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT r.RoomID,
                   r.Name                              AS roomName,
                   wt.TypeName                         AS roomType,
                   rs.StatusName                       AS roomStatus,
                   COUNT(b.BookingID)                  AS bookingCount
            FROM rooms r
            LEFT JOIN bookings b ON b.RoomID = r.RoomID
                AND b.StartTime BETWEEN :fromDate AND :toDate
            LEFT JOIN bookingstatus bs ON bs.StatusID = b.StatusID
                AND bs.StatusName IN ('CONFIRMED', 'COMPLETED')
            JOIN workspacetypes wt ON wt.TypeID = r.TypeID
            JOIN roomstatus rs     ON rs.StatusID = r.StatusID
            GROUP BY r.RoomID, r.Name, wt.TypeName, rs.StatusName
            ORDER BY bookingCount DESC
            """, nativeQuery = true)
    List<Object[]> occupancyByRoom(@Param("fromDate") LocalDateTime fromDate,
                                   @Param("toDate") LocalDateTime toDate);

    // ─────────────────────────────────────────────
    // OCCUPANCY: tổng số phòng
    // ─────────────────────────────────────────────
    @Query(value = "SELECT COUNT(*) FROM rooms", nativeQuery = true)
    Long countTotalRooms();

    // ─────────────────────────────────────────────
    // REVENUE EXPORT: chi tiết theo ngày (dùng cho Excel)
    // ─────────────────────────────────────────────
    @Query(value = """
            SELECT DATE_FORMAT(b.StartTime, '%d/%m/%Y') AS period,
                   COUNT(b.BookingID)                   AS bookingCount,
                   COALESCE(SUM(b.TotalAmount), 0)      AS totalRevenue
            FROM bookings b
            JOIN bookingstatus bs ON bs.StatusID = b.StatusID
            WHERE b.StartTime BETWEEN :fromDate AND :toDate
              AND bs.StatusName = 'COMPLETED'
            GROUP BY DATE_FORMAT(b.StartTime, '%d/%m/%Y'), DATE(b.StartTime)
            ORDER BY DATE(b.StartTime)
            """, nativeQuery = true)
    List<Object[]> revenueDetailForExport(@Param("fromDate") LocalDateTime fromDate,
                                          @Param("toDate") LocalDateTime toDate);
}