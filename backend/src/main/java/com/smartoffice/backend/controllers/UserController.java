package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.user.AvatarRequest;
import com.smartoffice.backend.dto.user.ChangePasswordRequest;
import com.smartoffice.backend.dto.user.UpdateProfileRequest;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Hàm phụ trợ để lấy Email từ Token (Viết riêng ra cho code gọn)
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    @GetMapping("/profile")
    public ApiResponse<User> getProfile() {
        User user = userService.getUserProfile(getCurrentUserEmail());
        return ApiResponse.success(user);
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateProfile(@RequestBody UpdateProfileRequest request) {
        User updatedUser = userService.updateProfile(getCurrentUserEmail(), request);
        return ApiResponse.success(updatedUser);
    }

    @PutMapping("/change-password")
    public ApiResponse<?> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(getCurrentUserEmail(), request);
        return ApiResponse.success("Đổi mật khẩu thành công!");
    }

    @PutMapping("/avatar")
    public ApiResponse<?> updateAvatar(@RequestBody AvatarRequest request) {
        userService.updateAvatar(getCurrentUserEmail(), request.avatar);
        return ApiResponse.success("Cập nhật ảnh thành công!");
    }
}
