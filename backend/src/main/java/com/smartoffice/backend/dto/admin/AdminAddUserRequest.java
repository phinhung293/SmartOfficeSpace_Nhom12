package com.smartoffice.backend.dto.admin;

import lombok.Data;

@Data
public class AdminAddUserRequest {
    private String name;
    private String email;
    private String phone;
    private String status;
}
