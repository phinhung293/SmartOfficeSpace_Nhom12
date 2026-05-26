package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "paymentStatus")
@Data
public class PaymentStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StatusID")
    private Integer statusId;

    @Column(name = "StatusName", nullable = false, length = 30)
    private String statusName;
}
