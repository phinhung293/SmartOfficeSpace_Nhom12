package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.admin.AdminAddUserRequest;
import com.smartoffice.backend.dto.admin.AdminUpdateUserRequest;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    public ApiResponse<List<User>> getUsers(@RequestParam(required = false) String role) {
        return ApiResponse.success(userService.getUsers(role));
    }

    @PostMapping("/users")
    public ApiResponse<?> addUser(@RequestBody AdminAddUserRequest req) {
        userService.addUser(req.getName(), req.getEmail(), req.getPhone(), req.getStatus());
        return ApiResponse.success("Thêm người dùng mới thành công!");
    }

    @PutMapping("/users/{id}")
    public ApiResponse<?> updateUser(@PathVariable Integer id, @RequestBody AdminUpdateUserRequest req) {
        userService.updateUserInfo(id, req.getName(), req.getPhone(), req.getStatus());
        return ApiResponse.success("Cập nhật thông tin người dùng thành công!");
    }

    @PutMapping("/users/{id}/toggle")
    public ApiResponse<?> toggleStatus(@PathVariable Integer id) {
        userService.toggleUserStatus(id);
        return ApiResponse.success("Cập nhật trạng thái thành công!");
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<?> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ApiResponse.success("Xóa người dùng thành công!");
    }
}
