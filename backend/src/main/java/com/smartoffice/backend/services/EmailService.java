package com.smartoffice.backend.services;

import com.smartoffice.backend.entities.Booking;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");

    // Gửi async để không block luồng chính
    @Async
    public void sendBookingConfirmation(Booking booking) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("✅ Đặt phòng thành công - " + booking.getBookingCode());
            helper.setText(buildBookingHtml(booking), true); // true = HTML
            mailSender.send(msg);
            log.info("Email đặt phòng đã gửi đến {}", booking.getUser().getEmail());
        } catch (Exception e) {
            log.error("Lỗi gửi email đặt phòng: {}", e.getMessage());
        }
    }

    @Async
    public void sendPaymentConfirmation(Booking booking) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("💳 Thanh toán thành công - " + booking.getBookingCode());
            helper.setText(buildPaymentHtml(booking), true);
            mailSender.send(msg);
            log.info("Email thanh toán đã gửi đến {}", booking.getUser().getEmail());
        } catch (Exception e) {
            log.error("Lỗi gửi email thanh toán: {}", e.getMessage());
        }
    }

    @Async
    public void sendReminderEmail(Booking booking) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("⏰ Nhắc lịch: " + booking.getRoom().getName() + " sắp bắt đầu");
            helper.setText(buildReminderHtml(booking), true);
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("Lỗi gửi email nhắc lịch: {}", e.getMessage());
        }
    }

    // ── HTML Templates ──

    private String buildBookingHtml(Booking b) {
        String amount = NumberFormat.getNumberInstance(new Locale("vi","VN"))
                .format(b.getTotalAmount()) + "đ";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px">
              <div style="background:#0b57ff;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="margin:0;font-size:22px">Smart Office Space</h1>
                <p style="margin:6px 0 0;opacity:.85">Đặt phòng thành công!</p>
              </div>
              <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                <p style="color:#333;font-size:15px">Xin chào <b>%s</b>,</p>
                <p style="color:#555">Đặt phòng của bạn đã được xác nhận thành công.</p>
                <div style="background:#f0f5ff;border-left:4px solid #0b57ff;padding:16px 20px;border-radius:8px;margin:20px 0">
                  <p style="margin:0 0 8px;color:#0b57ff;font-weight:700">%s</p>
                  <table style="width:100%%;color:#333;font-size:14px;border-collapse:collapse">
                    <tr><td style="padding:4px 0;color:#777">Phòng</td><td style="font-weight:600">%s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Bắt đầu</td><td>%s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Kết thúc</td><td>%s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Tổng tiền</td><td style="color:#0b57ff;font-weight:700">%s</td></tr>
                  </table>
                </div>
                <p style="color:#555;font-size:13px">⚠️ Vui lòng thanh toán trong vòng <b>5 phút</b> để giữ chỗ.</p>
                <p style="color:#aaa;font-size:12px;margin-top:32px">© 2026 Smart Office Space · Đại học Công Nghệ Sài Gòn</p>
              </div>
            </div>
            """.formatted(
                b.getUser().getName(), b.getBookingCode(),
                b.getRoom().getName(),
                FMT.format(b.getStartTime()), FMT.format(b.getEndTime()), amount
        );
    }

    private String buildPaymentHtml(Booking b) {
        String amount = NumberFormat.getNumberInstance(new Locale("vi","VN"))
                .format(b.getTotalAmount()) + "đ";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px">
              <div style="background:#1a7f3c;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="margin:0;font-size:22px">✅ Thanh toán thành công</h1>
              </div>
              <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                <p>Xin chào <b>%s</b>, thanh toán của bạn đã được xác nhận.</p>
                <div style="background:#f0fff4;border-left:4px solid #1a7f3c;padding:16px 20px;border-radius:8px;margin:20px 0">
                  <table style="width:100%%;color:#333;font-size:14px;border-collapse:collapse">
                    <tr><td style="padding:4px 0;color:#777">Mã đơn</td><td style="font-weight:600">%s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Phòng</td><td>%s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Giờ</td><td>%s → %s</td></tr>
                    <tr><td style="padding:4px 0;color:#777">Đã thanh toán</td><td style="color:#1a7f3c;font-weight:700">%s</td></tr>
                  </table>
                </div>
              </div>
            </div>
            """.formatted(
                b.getUser().getName(), b.getBookingCode(),
                b.getRoom().getName(),
                FMT.format(b.getStartTime()), FMT.format(b.getEndTime()), amount
        );
    }

    private String buildReminderHtml(Booking b) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px">
              <div style="background:#f59e0b;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="margin:0;font-size:22px">⏰ Nhắc lịch đặt phòng</h1>
              </div>
              <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px">
                <p>Xin chào <b>%s</b>,</p>
                <p>Phòng <b>%s</b> của bạn sẽ bắt đầu lúc <b>%s</b>. Vui lòng có mặt trước 10 phút.</p>
              </div>
            </div>
            """.formatted(
                b.getUser().getName(), b.getRoom().getName(), FMT.format(b.getStartTime())
        );
    }
}