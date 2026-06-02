package com.smartoffice.backend.dto.payment;

import lombok.Data;

@Data
public class PaymentInitiationRequest {
    private Integer bookingId;
    private String paymentMethod; // "SEPAY" or "CASH"
}
