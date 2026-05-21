package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;
    @GetMapping("/users")
    public ApiResponse<List<User>> getUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            return ApiResponse.success(userRepository.findByRole_RoleName(role));
        }
        return ApiResponse.success(userService.getAllUsers());
    }

    @PutMapping("/users/{id}/toggle")
    public ApiResponse<String> toggleStatus(@PathVariable Integer id) {
        userService.toggleUserStatus(id);
        return ApiResponse.success("Cập nhật trạng thái thành công");
    }
}
