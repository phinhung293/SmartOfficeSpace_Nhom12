package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.admin.AdminNotificationDto;
import com.smartoffice.backend.dto.admin.NotificationSummaryDto;
import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.entities.Notification;
import com.smartoffice.backend.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;


import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private static final List<String> IMPORTANT_TYPES =
            Arrays.asList("PAYMENT", "CANCELLATION", "REMINDER");
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM");

    // ── Gọi sau khi tạo booking ──
    @Transactional
    public void onBookingCreated(Booking booking) {
        save(booking.getUser(), "BOOKING",
                "Đặt phòng " + booking.getRoom().getName() + " lúc " + FMT.format(booking.getStartTime()) + " thành công. Mã: " + booking.getBookingCode(),
                booking.getBookingId());
        emailService.sendBookingConfirmation(booking); // async
    }

    // ── Gọi sau khi admin xác nhận thanh toán ──
    @Transactional
    public void onPaymentConfirmed(Booking booking) {
        save(booking.getUser(), "PAYMENT",
                "Thanh toán cho đơn " + booking.getBookingCode() + " đã được xác nhận. Số tiền: " + booking.getTotalAmount() + "đ",
                booking.getBookingId());
        emailService.sendPaymentConfirmation(booking); // async
    }

    // ── Gọi từ Cron nhắc lịch ──
    @Transactional
    public void onBookingReminder(Booking booking) {
        // Tránh gửi 2 lần nếu cron chạy lại
        boolean alreadySent = !notificationRepository.findReminderByBookingId(booking.getBookingId()).isEmpty();
        if (alreadySent) return;

        save(booking.getUser(), "REMINDER",
                "Nhắc lịch: Phòng " + booking.getRoom().getName() + " bắt đầu lúc " + FMT.format(booking.getStartTime()),
                booking.getBookingId());
        emailService.sendReminderEmail(booking); // async
    }

    // ── API: lấy danh sách cho user ──
    public List<Notification> getForUser(Integer userId) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    // ── API: đếm chưa đọc ──
    public long countUnread(Integer userId) {
        return notificationRepository.countByUser_UserIdAndIsRead(userId, 0);
    }

    // ── API: đánh dấu 1 cái đã đọc ──
    @Transactional
    public void markRead(Integer notifyId) {
        notificationRepository.findById(notifyId).ifPresent(n -> {
            n.setIsRead(1);
            notificationRepository.save(n);
        });
    }

    // ── API: đánh dấu tất cả đã đọc ──
    @Transactional
    public void markAllRead(Integer userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    // ── Helper ──
    private void save(com.smartoffice.backend.entities.User user, String type, String message, Integer refId) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setReferenceId(refId);
        notificationRepository.save(n);
    }

    public List<Notification> getRelated(Integer userId, Integer excludeNotifyId) {
        return notificationRepository.findRelated(userId, excludeNotifyId, PageRequest.of(0, 5));
    }

    // ── ADMIN: lấy tất cả thông báo hệ thống ──
    public List<Notification> getAllForAdmin(int page, int size) {
        return notificationRepository.findAllOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    // ── ADMIN: đếm chưa đọc toàn hệ thống ──
    public long countAllUnread() {
        return notificationRepository.countAllUnread();
    }

    // ── ADMIN: đánh dấu tất cả đã đọc toàn hệ thống ──
    @Transactional
    public void markAllReadGlobal() {
        notificationRepository.markAllReadGlobal();
    }

    // ── Gọi khi hủy booking ──
    @Transactional
    public void onBookingCancelled(Booking booking) {
        save(booking.getUser(), "CANCELLATION",
                "Đơn đặt phòng " + booking.getBookingCode()
                        + " - Phòng " + booking.getRoom().getName() + " đã bị hủy.",
                booking.getBookingId());
    }

    // ── ADMIN: lấy summary tổng hợp ──
    public NotificationSummaryDto getSummary() {
        java.time.LocalDateTime dayStart = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime dayEnd   = dayStart.plusDays(1);

        long total      = notificationRepository.countAll();
        long unread     = notificationRepository.countAllUnread();
        long today      = notificationRepository.countToday(dayStart, dayEnd);
        long bookingCnt = notificationRepository.countByType("BOOKING");
        long paymentCnt = notificationRepository.countByType("PAYMENT");
        long cancelCnt  = notificationRepository.countByType("CANCELLATION");

        List<Notification> recent = notificationRepository
                .findAllOrderByCreatedAtDesc(PageRequest.of(0, 20));

        List<AdminNotificationDto> recentDtos = toAdminDtoList(recent);

        // Tab "Quan trọng": PAYMENT, CANCELLATION, REMINDER
        List<AdminNotificationDto> importantDtos = recentDtos.stream()
                .filter(n -> IMPORTANT_TYPES.contains(n.getType()))
                .collect(Collectors.toList());

        // Tab "Thông báo": BOOKING, SYSTEM, ...
        List<AdminNotificationDto> generalDtos = recentDtos.stream()
                .filter(n -> !IMPORTANT_TYPES.contains(n.getType()))
                .collect(Collectors.toList());

        List<Notification> todayList = notificationRepository.findToday(dayStart, dayEnd);
        List<AdminNotificationDto> todayDtos = toAdminDtoList(todayList);

        return new NotificationSummaryDto(
                total, unread, today,
                bookingCnt, paymentCnt, cancelCnt,
                importantDtos, generalDtos,
                recentDtos, todayDtos
        );
    }

    // ── Helper: convert Notification → AdminNotificationDto ──
    private List<AdminNotificationDto> toAdminDtoList(List<Notification> list) {
        return list.stream().map(n -> {
            AdminNotificationDto dto = new AdminNotificationDto();
            dto.setNotifyId(n.getNotifyId());
            dto.setMessage(n.getMessage());
            dto.setType(n.getType());
            dto.setIsRead(n.getIsRead());
            dto.setReferenceId(n.getReferenceId());
            dto.setCreatedAt(n.getCreatedAt());
            if (n.getUser() != null) {
                dto.setUserId(n.getUser().getUserId());
                dto.setUserName(n.getUser().getName());
                dto.setUserEmail(n.getUser().getEmail());
            }
            return dto;
        }).collect(Collectors.toList());
    }
    public List<Notification> searchForAdmin(String keyword, String type,
                                             java.time.LocalDateTime dateFrom, java.time.LocalDateTime dateTo,
                                             int page, int size) {
        return notificationRepository.searchForAdmin(
                (keyword != null && !keyword.isBlank()) ? keyword : null,
                (type != null && !type.isBlank()) ? type : null,
                dateFrom, dateTo,
                PageRequest.of(page, size)
        );
    }

    public long countSearchForAdmin(String keyword, String type,
                                    java.time.LocalDateTime dateFrom, java.time.LocalDateTime dateTo) {
        return notificationRepository.countSearchForAdmin(
                (keyword != null && !keyword.isBlank()) ? keyword : null,
                (type != null && !type.isBlank()) ? type : null,
                dateFrom, dateTo
        );
    }
}