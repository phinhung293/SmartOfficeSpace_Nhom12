package com.smartoffice.backend.services;

import com.smartoffice.backend.component.JwtUtils;
import com.smartoffice.backend.dto.user.LoginRequest;
import com.smartoffice.backend.dto.user.LoginResponse;
import com.smartoffice.backend.dto.user.RegisterRequest;
import com.smartoffice.backend.entities.Role;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.RoleRepository;
import com.smartoffice.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public User register(RegisterRequest request) {
        // 1. Kiểm tra trùng Email hoặc SĐT
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng!");
        }

        // 2. Tìm quyền mặc định là CUSTOMER (Giả sử trong DB RoleName là 'CUSTOMER')
        // Lưu ý: Nhóm bạn cần chạy script thêm sẵn các quyền (ADMIN, STAFF, CUSTOMER) vào bảng roles nhé
        Role customerRole = roleRepository.findAll().stream()
                .filter(r -> r.getRoleName().equalsIgnoreCase("CUSTOMER"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quyền CUSTOMER trong hệ thống"));

        // 3. Tạo User mới và mã hóa mật khẩu
        User newUser = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                // Mã hóa mật khẩu bằng BCrypt
                .password(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .role(customerRole)
                .build();

        return userRepository.save(newUser);
    }
    public LoginResponse login(LoginRequest request) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // 2. Kiểm tra mật khẩu (So sánh pass thô và pass đã băm)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        // 3. Tạo Token
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().getRoleName());

        // 4. Trả về thông tin cần thiết
        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .name(user.getName())
                .build();
    }
}
