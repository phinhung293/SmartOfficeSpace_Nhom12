package com.smartoffice.backend.dto.admin;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String name;
    private String phone;
    private String status;
}
