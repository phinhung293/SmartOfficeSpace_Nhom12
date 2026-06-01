package com.smartoffice.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSummaryDto {
    // Thẻ số liệu trên cùng
    private long totalNotifications;      // Tổng thông báo đã gửi
    private long unreadCount;             // Thông báo chưa đọc
    private long todayCount;              // Thông báo hôm nay
    private long bookingCount;            // Loại đặt phòng
    private long paymentCount;            // Loại thanh toán
    private long cancellationCount;       // Loại hủy phòng

    private List<AdminNotificationDto> importantNotifications; // PAYMENT, CANCELLATION, REMINDER
    private List<AdminNotificationDto> generalNotifications;   // BOOKING, SYSTEM, PROMOTION
    // Danh sách thông báo gần đây (bảng)
    private List<AdminNotificationDto> recentNotifications;
    private List<AdminNotificationDto> todayNotifications;


}