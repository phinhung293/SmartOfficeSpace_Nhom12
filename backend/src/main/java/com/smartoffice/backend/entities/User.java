package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder // Giúp tạo đối tượng User nhanh hơn
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer userId;

    @Column(name = "Name", nullable = false, length = 100)
    private String name;

    @Column(name = "Email", nullable = false, unique = true, length = 50)
    private String email;

    @Column(name = "Password", nullable = false, length = 255)
    private String password;

    @Column(name = "Phone")
    @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải bao gồm đúng 10 chữ số")
    private String phone;
    @Column(name = "DateOfBirth")
    private java.time.LocalDate dateOfBirth; // Ngày sinh (Dùng LocalDate để lưu ngày chuẩn)

    @Column(name = "Gender", length = 10)
    private String gender; // Giới tính (Nam, Nữ, Khác)

    @Lob // Đánh dấu đây là dữ liệu lớn (Large Object)
    @Column(name = "Avatar", columnDefinition = "LONGTEXT")
    private String avatar; // Đường dẫn lưu ảnh đại diện (URL hoặc tên file)
    @Column(name = "Status", nullable = false, length = 30)
    private String status;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "code_expiry")
    private LocalDateTime codeExpiry;
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;

    // Mối quan hệ với bảng Roles
    @ManyToOne
    @JoinColumn(name = "RoleID", nullable = false)
    private Role role;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
