package com.smartoffice.backend.services;

import com.smartoffice.backend.entities.User;
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
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Đổi trạng thái từ ACTIVE sang LOCKED và ngược lại
        user.setStatus(user.getStatus().equals("ACTIVE") ? "LOCKED" : "ACTIVE");
        userRepository.save(user);
    }
    // Lấy thông tin cá nhân qua Email (lấy từ Token)
    public User getMyProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    // Cập nhật thông tin cơ bản
    public User updateProfile(String email, String newName, String newPhone) {
        User user = getMyProfile(email);
        user.setName(newName);
        user.setPhone(newPhone);
        return userRepository.save(user);
    }

    // Đổi mật khẩu
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = getMyProfile(email);
        // Kiểm tra mật khẩu cũ có đúng không
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }
        // Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
