package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.payment.PaymentInitiationRequest;
import com.smartoffice.backend.dto.payment.PaymentStatusResponse;
import com.smartoffice.backend.dto.payment.SepayCreateQRResponse;
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
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    /**
     * Tạo QR thanh toán SePay
     * POST /api/payments/create-qr
     */
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

    /**
     * Mô phỏng thanh toán thành công (chỉ dùng trong test)
     * POST /api/payments/simulate/{bookingId}
     */
    @PostMapping("/simulate/{bookingId}")
    public ApiResponse<Void> simulatePayment(
            @PathVariable Integer bookingId,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);

        sepayService.simulateSuccessfulPayment(bookingId);
        return ApiResponse.successMessage("Thanh toán mô phỏng thành công");
    }

    /**
     * Xác nhận thanh toán (admin hoặc user tự xác nhận sau khi chuyển khoản)
     * POST /api/payments/confirm/{bookingId}
     */
    @PostMapping("/confirm/{bookingId}")
    public ApiResponse<Void> confirmPayment(
            @PathVariable Integer bookingId,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);

        sepayService.confirmPayment(bookingId);
        return ApiResponse.successMessage("Xác nhận thanh toán thành công");
    }

    /**
     * Hủy thanh toán
     * POST /api/payments/cancel/{bookingId}
     */
    @PostMapping("/cancel/{bookingId}")
    public ApiResponse<Void> cancelPayment(
            @PathVariable Integer bookingId,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);

        sepayService.cancelPayment(bookingId);
        return ApiResponse.successMessage("Đã hủy thanh toán");
    }

    /**
     * Kiểm tra trạng thái thanh toán
     * GET /api/payments/status/{bookingId}
     */
    @GetMapping("/status/{bookingId}")
    public ApiResponse<PaymentStatusResponse> getPaymentStatus(
            @PathVariable Integer bookingId,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);

        PaymentStatusResponse status = sepayService.getPaymentStatus(bookingId);
        return ApiResponse.success(status);
    }

    /**
     * Lấy thông tin thanh toán (QR + hướng dẫn)
     * GET /api/payments/info/{bookingId}
     */
    @GetMapping("/info/{bookingId}")
    public ApiResponse<PaymentStatusResponse> getPaymentInfo(
            @PathVariable Integer bookingId,
            Principal principal
    ) {
        validateUser(principal);
        validateBookingOwnership(bookingId, principal);

        PaymentStatusResponse response = sepayService.getPaymentStatus(bookingId);

        // Add QR code if still pending
        if ("PENDING_PAYMENT".equals(response.getStatus())) {
            SepayCreateQRResponse qr = sepayService.createQRPayment(bookingId);
            response.setQrCode(qr.getData() != null ? qr.getData().getQrCode() : null);
        }

        return ApiResponse.success(response);
    }

    private void validateUser(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập để thực hiện thanh toán");
        }
    }

    private void validateBookingOwnership(Integer bookingId, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        boolean isOwner = bookingRepository.findById(bookingId)
                .map(booking -> booking.getUser().getUserId().equals(user.getUserId()))
                .orElse(false);

        boolean isAdmin = "ADMIN".equals(user.getRole().getRoleName());

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
    }

}
