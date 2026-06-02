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

        // MOCK RESPONSE cho test (vì SePay sandbox chưa hoạt động)
        SepayCreateQRResponse mockResponse = new SepayCreateQRResponse();
        mockResponse.setSuccess(true);
        mockResponse.setMessage("Mock QR created - SePay sandbox unavailable");

        SepayCreateQRResponse.QRData mockData = new SepayCreateQRResponse.QRData();
        mockData.setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WS" + booking.getBookingCode());
        mockData.setOrderId(booking.getBookingCode());
        mockData.setTransactionId("MOCK_" + System.currentTimeMillis());
        mockResponse.setData(mockData);

        log.info("✅ Mock QR created for booking: {}", booking.getBookingCode());
        return mockResponse;
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
                .amount(booking.getTotalAmount().toString())
                .transactionContent("WS" + booking.getBookingCode())
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

        log.info("✅ Payment confirmed for booking: {} - New status: {}",
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
}