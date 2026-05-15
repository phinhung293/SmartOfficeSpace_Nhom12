package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Hệ thống Smart Office Space đang hoạt động ổn định!");
    }
}
