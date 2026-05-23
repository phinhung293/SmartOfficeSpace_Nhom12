package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.user.LoginRequest;
import com.smartoffice.backend.dto.user.LoginResponse;
import com.smartoffice.backend.dto.user.RegisterRequest;
import com.smartoffice.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    @PostMapping("/forgot-password/send-code")
    public ApiResponse<String> sendCode(@RequestParam String email) {
        try {
            authService.sendResetCode(email);
            return ApiResponse.success("Mã xác minh đã được gửi vào email!");
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @PostMapping("/forgot-password/verify-code")
    public ApiResponse<String> verifyCode(@RequestParam String email, @RequestParam String code) {
        try {
            authService.verifyOtpCode(email, code);
            return ApiResponse.success("Mã xác minh hợp lệ!");
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @PostMapping("/forgot-password/reset")
    public ApiResponse<String> resetPassword(@RequestParam String email, @RequestParam String code, @RequestParam String newPassword) {
        try {
            authService.resetPasswordWithCode(email, code, newPassword);
            return ApiResponse.success("Đặt lại mật khẩu thành công!");
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
