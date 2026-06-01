package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.payment.PaymentStatusResponse;
import com.smartoffice.backend.dto.payment.SepayCreateQRResponse;

public interface SepayService {


    SepayCreateQRResponse createQRPayment(Integer bookingId); //Tạo QR code thanh toán SePay
    void simulateSuccessfulPayment(Integer bookingId); //Mô phỏng thanh toán thành công (Sandbox only)
    PaymentStatusResponse getPaymentStatus(Integer bookingId); //Kiểm tra trạng thái thanh toán của booking
    void confirmPayment(Integer bookingId); //Xác nhận thanh toán thành công (cập nhật booking thành CONFIRMED)
    void cancelPayment(Integer bookingId); //Hủy thanh toán (chuyển booking thành CANCELLED)

}
