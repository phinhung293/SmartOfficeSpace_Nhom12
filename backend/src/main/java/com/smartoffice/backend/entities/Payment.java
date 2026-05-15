package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Payments")
@Data
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PaymentID")
    private Integer paymentId;

    @ManyToOne
    @JoinColumn(name = "BookingID", nullable = false)
    private Booking booking;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal amount;

    @ManyToOne
    @JoinColumn(name = "StatusID", nullable = false)
    private PaymentStatus paymentStatus;

    @ManyToOne
    @JoinColumn(name = "MethodID", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "TransactionCode", unique = true, length = 100)
    private String transactionCode;

    @Column(name = "PaymentDate")
    private java.time.LocalDateTime paymentDate;

    @Column(name = "CreatedAt")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
