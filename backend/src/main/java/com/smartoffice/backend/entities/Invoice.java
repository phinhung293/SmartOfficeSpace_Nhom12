package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Invoices")
@Data
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InvoiceID")
    private Integer invoiceId;

    @ManyToOne
    @JoinColumn(name = "BookingID", nullable = false)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "PaymentID", nullable = false)
    private Payment payment;

    @Column(name = "Total", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal total;

    @Column(name = "CreatedAt")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
