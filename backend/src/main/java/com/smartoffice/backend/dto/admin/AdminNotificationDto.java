package com.smartoffice.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDto {
    private Integer notifyId;
    private String  message;
    private String  type;
    private Integer isRead;
    private Integer referenceId;
    private LocalDateTime createdAt;
    private Integer userId;
    private String  userName;
    private String  userEmail;
    private java.math.BigDecimal totalAmount;
}