package com.smartoffice.backend.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentStatusResponse {
    private String bookingCode;
    private String status; // PENDING_PAYMENT, CONFIRMED, CANCELLED, EXPIRED
    private String qrCode;
    private String bankAccountNumber;
    private String bankAccountName;
    private String bankCode;
    private String amount;
    private String transactionContent;
}
