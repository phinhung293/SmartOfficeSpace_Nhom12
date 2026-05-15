package com.smartoffice.backend.component;

import com.smartoffice.backend.entities.Role;
import com.smartoffice.backend.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra nếu bảng Roles đang trống thì mới chèn
        if (roleRepository.count() == 0) {
            // Chèn Admin (Sẽ có ID 1 do Auto Increment)
            roleRepository.save(new Role(null, "ADMIN"));
            // Chèn User (Sẽ có ID 2)
            roleRepository.save(new Role(null, "USER"));

            System.out.println(">> Đã khởi tạo dữ liệu mẫu cho bảng Roles (1: ADMIN, 2: USER)");
        }
    }
}
