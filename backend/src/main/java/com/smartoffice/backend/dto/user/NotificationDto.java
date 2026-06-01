package com.smartoffice.backend.dto.user;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Integer notifyId;
    private String  message;
    private String  type;
    private Integer isRead;
    private Integer referenceId;
    private LocalDateTime createdAt;
}