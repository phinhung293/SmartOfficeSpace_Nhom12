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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final JavaMailSender mailSender;
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
        if ("LOCKED".equals(user.getStatus())) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!");
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
    public void sendResetCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này!"));

        // Sinh mã OTP 6 chữ số ngẫu nhiên (từ 100000 đến 999999)
        String otpCode = String.valueOf(100000 + new Random().nextInt(900000));

        user.setVerificationCode(otpCode);
        user.setCodeExpiry(LocalDateTime.now().plusMinutes(5)); // Mã OTP có hiệu lực trong 5 phút
        userRepository.save(user);

        // Gửi email chứa mã OTP thật về máy người dùng
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("[Smart Office Space] Mã xác minh đặt lại mật khẩu");
        message.setText("Chào " + user.getName() + ",\n\n"
                + "Mã xác minh đặt lại mật khẩu của bạn là: " + otpCode + "\n"
                + "Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.");

        mailSender.send(message);
    }

    // 2. Bước 2: Kiểm tra mã OTP xem đúng và còn hạn không
    public void verifyOtpCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new RuntimeException("Mã xác minh không chính xác!");
        }

        if (user.getCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã xác minh đã hết hạn! Vui lòng gửi lại mã.");
        }
    }

    // 3. Bước 3: Tiến hành đổi mật khẩu mới
    public void resetPasswordWithCode(String email, String code, String newPassword) {
        // Gọi lại hàm kiểm tra mã một lần nữa để đảm bảo tính bảo mật
        verifyOtpCode(email, code);

        User user = userRepository.findByEmail(email).get();

        // ---------------------------------------------------------
        // THÊM LOGIC: Kiểm tra mật khẩu mới có trùng mật khẩu cũ không
        // ---------------------------------------------------------
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        // Nếu không trùng thì mới băm mật khẩu mới và lưu xuống DB
        user.setPassword(passwordEncoder.encode(newPassword));

        // Xóa mã OTP sau khi đổi mật khẩu thành công
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);
    }
}
