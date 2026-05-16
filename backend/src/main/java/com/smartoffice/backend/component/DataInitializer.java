package com.smartoffice.backend.component;

import com.smartoffice.backend.entities.Role;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.RoleRepository;
import com.smartoffice.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // 1. KHỞI TẠO CÁC QUYỀN (Chỉ gồm 2 Role: ADMIN và CUSTOMER)
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, "ADMIN"));
            roleRepository.save(new Role(null, "CUSTOMER"));
            System.out.println(">> [DataSeeder] Đã khởi tạo thành công 2 quyền: ADMIN, CUSTOMER");
        }

        // Lấy các quyền từ DB ra để gán cho tài khoản mẫu
        List<Role> allRoles = roleRepository.findAll();
        Role adminRole = allRoles.stream().filter(r -> r.getRoleName().equalsIgnoreCase("ADMIN")).findFirst().orElse(null);
        Role customerRole = allRoles.stream().filter(r -> r.getRoleName().equalsIgnoreCase("CUSTOMER")).findFirst().orElse(null);

        // 2. TỰ ĐỘNG TẠO TÀI KHOẢN ADMIN MẪU
        if (adminRole != null && !userRepository.existsByEmail("admin@gmail.com")) {
            userRepository.save(User.builder()
                    .name("Admin")
                    .email("admin@gmail.com")
                    .phone("0912345678") // Số điện thoại tự cho
                    .password(passwordEncoder.encode("admin@123")) // Mã hóa mật khẩu chuẩn bảo mật
                    .status("ACTIVE")
                    .role(adminRole)
                    .build());
            System.out.println(">> [DataSeeder] Đã tạo tài khoản Admin thành công!");
        }

        // 3. TỰ ĐỘNG TẠO TÀI KHOẢN USER (CUSTOMER) MẪU
        if (customerRole != null && !userRepository.existsByEmail("test1@gmail.com")) {
            userRepository.save(User.builder()
                    .name("Lâm Phi Nhung")
                    .email("test1@gmail.com")
                    .phone("0987654321") // Số điện thoại tự cho
                    .password(passwordEncoder.encode("Nhung@123")) // Mã hóa mật khẩu chuẩn bảo mật
                    .status("ACTIVE")
                    .role(customerRole)
                    .build());
            System.out.println(">> [DataSeeder] Đã tạo tài khoản User Lâm Phi Nhung thành công!");
        }
    }
}
