package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<User> getProfile(Authentication authentication) {
        // Authentication lấy từ SecurityContextHolder (do JwtFilter set vào)
        String email = authentication.getName();
        return ApiResponse.success(userService.getMyProfile(email));
    }

    @PutMapping("/me")
    public ApiResponse<User> updateProfile(Authentication authentication, @RequestBody User updateData) {
        String email = authentication.getName();
        return ApiResponse.success(userService.updateProfile(email, updateData.getName(), updateData.getPhone()));
    }
}
