package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.user.ChangePasswordRequest;
import com.smartoffice.backend.dto.user.UpdateProfileRequest;
import com.smartoffice.backend.entities.Role;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.RoleRepository;
import com.smartoffice.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    // =================================================================
    // KHU VỰC 1: CÁC HÀM DÀNH CHO ADMIN (QUẢN LÝ TẤT CẢ NGƯỜI DÙNG)
    // =================================================================

    // 1. Lấy danh sách (Có lọc theo Quyền)
    public List<User> getUsers(String role) {
        if (role != null && !role.isEmpty() && !role.equals("ALL")) {
            return userRepository.findByRole_RoleName(role);
        }
        return userRepository.findAll();
    }
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    // 2. Thêm người dùng mới
    public void addUser(String name, String email, String phone, String status) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại trên hệ thống!");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setStatus(status != null ? status : "ACTIVE");
        user.setPassword(passwordEncoder.encode("User@123456")); // Mật khẩu mặc định
        Role role = roleRepository.getReferenceById(2);

        user.setRole(role);
        userRepository.save(user);
    }

    // 3. Admin cập nhật thông tin người dùng
    public void updateUserInfo(Integer id, String name, String phone, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        user.setName(name);
        user.setPhone(phone);
        if (status != null) {
            user.setStatus(status);
        }
        userRepository.save(user);
    }

    // 4. Khóa / Mở khóa tài khoản
    public void toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        // Đổi trạng thái từ ACTIVE sang LOCKED và ngược lại
        user.setStatus(user.getStatus().equals("ACTIVE") ? "LOCKED" : "ACTIVE");
        userRepository.save(user);
    }

    // 5. Xóa người dùng
    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
    }


    // =================================================================
    // KHU VỰC 2: CÁC HÀM DÀNH CHO NGƯỜI DÙNG CÁ NHÂN (PROFILE)
    // =================================================================

    // 1. Lấy thông tin cá nhân của chính mình
    public User getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
    }

    // 2. Tự cập nhật hồ sơ cá nhân
    public User updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserProfile(email);
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setGender(request.getGender());
        user.setDateOfBirth(request.getDateOfBirth());

        return userRepository.save(user);
    }

    // 3. Tự đổi mật khẩu
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getUserProfile(email);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // 4. Cập nhật ảnh đại diện (Base64)
    public void updateAvatar(String email, String avatarData) {
        User user = getUserProfile(email);
        user.setAvatar(avatarData);
        userRepository.save(user);
    }
}
