package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // Lấy tất cả thông báo của user, mới nhất trước
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Integer userId);

    // Đếm thông báo chưa đọc (cho badge chuông)
    long countByUser_UserIdAndIsRead(Integer userId, Integer isRead);

    // Đánh dấu tất cả đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = 1 WHERE n.user.userId = :userId AND n.isRead = 0")
    int markAllReadByUserId(@Param("userId") Integer userId);

    // Lấy booking CONFIRMED sắp bắt đầu trong 30-60 phút (cho cron nhắc lịch)
    @Query("""
        SELECT n FROM Notification n
        WHERE n.type = 'REMINDER'
          AND n.referenceId = :bookingId
    """)
    List<Notification> findReminderByBookingId(@Param("bookingId") Integer bookingId);

    // Lấy các thông báo liên quan cùng referenceId, trừ bản thân nó
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.notifyId != :excludeId ORDER BY n.createdAt DESC")
    List<Notification> findRelated(@Param("userId") Integer userId, @Param("excludeId") Integer excludeId, Pageable pageable);

    // ── ADMIN: Lấy tất cả thông báo hệ thống (mọi user), mới nhất trước ──
    @Query("SELECT n FROM Notification n ORDER BY n.createdAt DESC")
    List<Notification> findAllOrderByCreatedAtDesc(Pageable pageable);

    // ── ADMIN: Đếm tổng thông báo chưa đọc toàn hệ thống ──
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = 0")
    long countAllUnread();

    // ── ADMIN: Đánh dấu tất cả đã đọc (toàn hệ thống) ──
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = 1 WHERE n.isRead = 0")
    int markAllReadGlobal();

    // Đếm theo type
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.type = :type")
    long countByType(@Param("type") String type);

    // Đếm thông báo hôm nay
    @Query("""
    SELECT COUNT(n) FROM Notification n
    WHERE n.createdAt >= :dayStart AND n.createdAt < :dayEnd
""")
    long countToday(
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd")   java.time.LocalDateTime dayEnd
    );

    // Đếm tổng tất cả
    @Query("SELECT COUNT(n) FROM Notification n")
    long countAll();

    // Lấy thông báo trong ngày hôm nay
    @Query("""
    SELECT n FROM Notification n
    WHERE n.createdAt >= :dayStart AND n.createdAt < :dayEnd
    ORDER BY n.createdAt DESC
""")
    List<Notification> findToday(
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd")   java.time.LocalDateTime dayEnd
    );

    @Query("""
    SELECT n FROM Notification n
    WHERE (:keyword IS NULL OR LOWER(n.message) LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:type IS NULL OR n.type = :type)
      AND (:dateFrom IS NULL OR n.createdAt >= :dateFrom)
      AND (:dateTo IS NULL OR n.createdAt <= :dateTo)
    ORDER BY n.createdAt DESC
""")
    List<Notification> searchForAdmin(
            @Param("keyword")  String keyword,
            @Param("type")     String type,
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo,
            Pageable pageable
    );

    @Query("""
    SELECT COUNT(n) FROM Notification n
    WHERE (:keyword IS NULL OR LOWER(n.message) LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:type IS NULL OR n.type = :type)
      AND (:dateFrom IS NULL OR n.createdAt >= :dateFrom)
      AND (:dateTo IS NULL OR n.createdAt <= :dateTo)
""")
    long countSearchForAdmin(
            @Param("keyword")  String keyword,
            @Param("type")     String type,
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo
    );
}