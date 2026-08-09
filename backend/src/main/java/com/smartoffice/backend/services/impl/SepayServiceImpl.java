package com.smartoffice.backend.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartoffice.backend.config.SepayConfig;
import com.smartoffice.backend.dto.payment.*;
import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.entities.BookingStatus;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.BookingStatusRepository;
import com.smartoffice.backend.services.SepayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class SepayServiceImpl implements SepayService {

    private final SepayConfig sepayConfig;
    private final BookingRepository bookingRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public SepayCreateQRResponse createQRPayment(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        if (!"PENDING_PAYMENT".equals(booking.getBookingStatus().getStatusName())) {
            throw new RuntimeException("Booking không ở trạng thái chờ thanh toán. Hiện tại: "
                    + booking.getBookingStatus().getStatusName());
        }

        BigDecimal actualAmount = getActualTransferAmount(booking);
        String content = buildTransferContent(booking);

        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                sepayConfig.getBankCode(),
                sepayConfig.getBankAccountNumber(),
                actualAmount.toBigInteger().toString(),
                URLEncoder.encode(content, StandardCharsets.UTF_8),
                URLEncoder.encode(sepayConfig.getBankAccountName(), StandardCharsets.UTF_8)
        );

        SepayCreateQRResponse response = new SepayCreateQRResponse();
        response.setSuccess(true);
        response.setMessage(sepayConfig.isDemoMode()
                ? "QR chuyển khoản thật (VietQR) - đang ở DEMO MODE, số tiền đã thu nhỏ x" + sepayConfig.getDemoScaleFactor()
                : "QR chuyển khoản thật (VietQR)");

        SepayCreateQRResponse.QRData data = new SepayCreateQRResponse.QRData();
        data.setQrCode(qrUrl);
        data.setOrderId(booking.getBookingCode());
        data.setTransactionId(content);
        response.setData(data);

        log.info("QR thật tạo cho booking {} - số tiền thật cần chuyển: {}đ (giá gốc: {}đ, demoMode={})",
                booking.getBookingCode(), actualAmount, booking.getTotalAmount(), sepayConfig.isDemoMode());

        return response;
    }

    @Override
    @Transactional
    public void simulateSuccessfulPayment(Integer bookingId) {
        log.info("Simulating payment for bookingId: {}", bookingId);
        confirmPayment(bookingId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        return PaymentStatusResponse.builder()
                .bookingCode(booking.getBookingCode())
                .status(booking.getBookingStatus().getStatusName())
                .bankAccountNumber(sepayConfig.getBankAccountNumber())
                .bankAccountName(sepayConfig.getBankAccountName())
                .bankCode(sepayConfig.getBankCode())
                .amount(getActualTransferAmount(booking).toString())
                .transactionContent(buildTransferContent(booking))
                .build();
    }

    @Override
    @Transactional
    public void confirmPayment(Integer bookingId) {
        log.info("Confirming payment for bookingId: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        log.info("Current booking status: {}", booking.getBookingStatus().getStatusName());

        if (!"PENDING_PAYMENT".equals(booking.getBookingStatus().getStatusName())) {
            throw new RuntimeException("Booking không ở trạng thái chờ thanh toán. Hiện tại: "
                    + booking.getBookingStatus().getStatusName());
        }

        BookingStatus confirmedStatus = bookingStatusRepository
                .findByStatusName("CONFIRMED")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạng thái CONFIRMED"));

        booking.setBookingStatus(confirmedStatus);
        booking.setLockedUntil(null);
        Booking saved = bookingRepository.save(booking);

        log.info("Payment confirmed for booking: {} - New status: {}",
                booking.getBookingCode(), saved.getBookingStatus().getStatusName());
    }

    @Override
    @Transactional
    public void cancelPayment(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        if (!"PENDING_PAYMENT".equals(booking.getBookingStatus().getStatusName())) {
            throw new RuntimeException("Chỉ có thể hủy booking đang chờ thanh toán");
        }

        BookingStatus cancelledStatus = bookingStatusRepository
                .findByStatusName("CANCELLED")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạng thái CANCELLED"));

        booking.setBookingStatus(cancelledStatus);
        booking.setLockedUntil(null);
        bookingRepository.save(booking);

        log.info("Payment cancelled for booking: {}", booking.getBookingCode());
    }

    @Override
    @Transactional
    public void handleIncomingTransaction(SepayWebhookRequest webhook) {
        if (webhook.getTransferType() != null && !"in".equalsIgnoreCase(webhook.getTransferType())) {
            log.info("Bỏ qua giao dịch không phải tiền vào: content={}", webhook.getContent());
            return;
        }

        String content = webhook.getContent() == null ? "" : webhook.getContent().replaceAll("\\s+", "");
        String bookingCode = extractBookingCode(content);

        if (bookingCode == null) {
            log.warn("Không tìm thấy bookingCode hợp lệ trong nội dung CK: '{}'", webhook.getContent());
            return;
        }

        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        if (booking == null) {
            log.warn("Webhook: không tìm thấy booking với code '{}' (raw content: '{}')", bookingCode, webhook.getContent());
            return;
        }

        if (!"PENDING_PAYMENT".equals(booking.getBookingStatus().getStatusName())) {
            log.info("Booking {} không còn PENDING_PAYMENT (hiện tại: {}), bỏ qua webhook.",
                    bookingCode, booking.getBookingStatus().getStatusName());
            return;
        }

        BigDecimal expectedAmount = getActualTransferAmount(booking);
        BigDecimal receivedAmount = webhook.getTransferAmount() == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(webhook.getTransferAmount());

        if (receivedAmount.compareTo(expectedAmount) < 0) {
            log.warn("Booking {}: số tiền nhận ({}đ) < số tiền yêu cầu ({}đ). KHÔNG tự confirm — cần đối soát thủ công.",
                    bookingCode, receivedAmount, expectedAmount);
            return;
        }

        confirmPayment(booking.getBookingId());
        log.info("✅ Webhook xác nhận thanh toán THẬT cho booking {} — đã nhận {}đ (yêu cầu {}đ)",
                bookingCode, receivedAmount, expectedAmount);
    }

    private BigDecimal getActualTransferAmount(Booking booking) {
        BigDecimal total = booking.getTotalAmount();
        if (sepayConfig.isDemoMode() && sepayConfig.getDemoScaleFactor() > 0) {
            return total.divide(
                    BigDecimal.valueOf(sepayConfig.getDemoScaleFactor()),
                    0, RoundingMode.CEILING
            );
        }
        return total;
    }

    private String buildTransferContent(Booking booking) {
        return booking.getBookingCode().replace("-", "");
    }

    private String extractBookingCode(String content) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("WS(\\d{6})(\\d{3,})").matcher(content);
        if (!m.find()) return null;
        String datePart = m.group(1);
        String idPart = m.group(2);
        String id3 = idPart.length() > 3 ? idPart.substring(0, 3) : idPart;
        return "WS" + datePart + "-" + id3;
    }
}