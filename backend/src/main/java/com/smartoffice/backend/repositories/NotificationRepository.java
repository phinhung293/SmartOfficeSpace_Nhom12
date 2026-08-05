package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // FIX #7 & #8: Thêm overload có Pageable để hỗ trợ phân trang từ controller
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    // Lấy tất cả thông báo của user (không phân trang — dùng nội bộ nếu cần)
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Integer userId);

    // Đếm thông báo chưa đọc (cho badge chuông)
    long countByUser_UserIdAndIsRead(Integer userId, Integer isRead);

    // Đánh dấu tất cả đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = 1 WHERE n.user.userId = :userId AND n.isRead = 0")
    int markAllReadByUserId(@Param("userId") Integer userId);

    // Kiểm tra đã gửi reminder chưa (tránh gửi 2 lần)
    @Query("""
        SELECT n FROM Notification n
        WHERE n.type = 'REMINDER'
          AND n.referenceId = :bookingId
    """)
    List<Notification> findReminderByBookingId(@Param("bookingId") Integer bookingId);

    // Lấy các thông báo liên quan cùng user, trừ bản thân
    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.notifyId != :excludeId ORDER BY n.createdAt DESC")
    List<Notification> findRelated(@Param("userId") Integer userId, @Param("excludeId") Integer excludeId, Pageable pageable);

    // ── ADMIN ────────────────────────────────────────────────────────────────

    @Query("SELECT n FROM Notification n ORDER BY n.createdAt DESC")
    List<Notification> findAllOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = 0")
    long countAllUnread();

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = 1 WHERE n.isRead = 0")
    int markAllReadGlobal();

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.type = :type")
    long countByType(@Param("type") String type);

    @Query("""
    SELECT COUNT(n) FROM Notification n
    WHERE n.createdAt >= :dayStart AND n.createdAt < :dayEnd
""")
    long countToday(
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd")   java.time.LocalDateTime dayEnd
    );

    @Query("SELECT COUNT(n) FROM Notification n")
    long countAll();

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