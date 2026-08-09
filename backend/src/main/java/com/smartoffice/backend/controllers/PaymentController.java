package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.config.SepayConfig;
import com.smartoffice.backend.dto.payment.PaymentInitiationRequest;
import com.smartoffice.backend.dto.payment.PaymentStatusResponse;
import com.smartoffice.backend.dto.payment.SepayCreateQRResponse;
import com.smartoffice.backend.dto.payment.SepayWebhookRequest;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.SepayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final SepayService sepayService;
    private final SepayConfig sepayConfig;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @PostMapping("/create-qr")
    public ApiResponse<SepayCreateQRResponse> createQRPayment(
            @RequestBody PaymentInitiationRequest request,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(request.getBookingId(), principal);
        SepayCreateQRResponse response = sepayService.createQRPayment(request.getBookingId());
        return ApiResponse.success(response);
    }

    @PostMapping("/simulate/{bookingId}")
    public ApiResponse<Void> simulatePayment(@PathVariable Integer bookingId, Principal principal) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);
        sepayService.simulateSuccessfulPayment(bookingId);
        return ApiResponse.successMessage("Thanh toán mô phỏng thành công");
    }

    // Với tiền thật: chỉ admin được confirm tay (webhook mới là nguồn xác nhận chính thức)
    @PostMapping("/confirm/{bookingId}")
    public ApiResponse<Void> confirmPayment(@PathVariable Integer bookingId, Principal principal) {
        validateUser(principal);
        validateAdminOnly(principal);
        sepayService.confirmPayment(bookingId);
        return ApiResponse.successMessage("Xác nhận thanh toán thành công");
    }

    @PostMapping("/cancel/{bookingId}")
    public ApiResponse<Void> cancelPayment(@PathVariable Integer bookingId, Principal principal) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);
        sepayService.cancelPayment(bookingId);
        return ApiResponse.successMessage("Đã hủy thanh toán");
    }

    @GetMapping("/status/{bookingId}")
    public ApiResponse<PaymentStatusResponse> getPaymentStatus(@PathVariable Integer bookingId, Principal principal) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);
        return ApiResponse.success(sepayService.getPaymentStatus(bookingId));
    }

    @GetMapping("/info/{bookingId}")
    public ApiResponse<PaymentStatusResponse> getPaymentInfo(@PathVariable Integer bookingId, Principal principal) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);
        PaymentStatusResponse response = sepayService.getPaymentStatus(bookingId);
        if ("PENDING_PAYMENT".equals(response.getStatus())) {
            SepayCreateQRResponse qr = sepayService.createQRPayment(bookingId);
            response.setQrCode(qr.getData() != null ? qr.getData().getQrCode() : null);
        }
        return ApiResponse.success(response);
    }

    @PostMapping("/webhook/sepay")
    public ApiResponse<Void> sepayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SepayWebhookRequest webhook
    ) {
        String expected = "Apikey " + sepayConfig.getWebhookSecret();
        if (sepayConfig.getWebhookSecret() == null || authHeader == null || !authHeader.equals(expected)) {
            log.warn("Webhook SePay bị từ chối: Authorization header không khớp");
            throw new RuntimeException("Webhook không hợp lệ");
        }
        sepayService.handleIncomingTransaction(webhook);
        return ApiResponse.successMessage("OK");
    }

    private void validateUser(Principal principal) {
        if (principal == null) throw new RuntimeException("Vui lòng đăng nhập để thực hiện thanh toán");
    }

    private void validateBookingOwnership(Integer bookingId, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        boolean isOwner = bookingRepository.findById(bookingId)
                .map(booking -> booking.getUser().getUserId().equals(user.getUserId()))
                .orElse(false);
        boolean isAdmin = "ADMIN".equals(user.getRole().getRoleName());
        if (!isOwner && !isAdmin) throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
    }

    private void validateAdminOnly(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (!"ADMIN".equals(user.getRole().getRoleName()))
            throw new RuntimeException("Chỉ admin mới có quyền xác nhận thanh toán thủ công");
    }
}