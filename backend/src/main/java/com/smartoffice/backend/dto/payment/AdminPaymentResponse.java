package com.smartoffice.backend.dto.payment;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminPaymentResponse {

    private Integer paymentId;

    private Integer bookingId;

    private String customerName;

    private String roomName;

    private BigDecimal amount;

    private String paymentMethod;

    private String status;

    private String transactionCode;

    private LocalDateTime paymentDate;
}