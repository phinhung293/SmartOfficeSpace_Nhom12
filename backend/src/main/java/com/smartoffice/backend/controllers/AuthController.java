package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.user.LoginRequest;
import com.smartoffice.backend.dto.user.LoginResponse;
import com.smartoffice.backend.dto.user.RegisterRequest;
import com.smartoffice.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    @PostMapping("/register")
    public ApiResponse<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ApiResponse.success("Đăng ký tài khoản thành công!");
        } catch (RuntimeException e) {
            // Chỗ này bạn có thể tạo một ApiResponse.error() nếu trong file ApiResponse của nhóm có hỗ trợ
            throw new RuntimeException(e.getMessage());
        }
    }
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
