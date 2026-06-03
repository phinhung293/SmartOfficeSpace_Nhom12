package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotifyID")
    private Integer notifyId;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "Message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "Type", nullable = false, length = 30)
    private String type;

    @Column(name = "IsRead")
    private Integer isRead = 0; // 0: Chưa đọc, 1: Đã đọc

    @Column(name = "ReferenceID")
    private Integer referenceId;

    @Column(name = "CreatedAt")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
