package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "Users")
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

    @Column(name = "Status", nullable = false, length = 30)
    private String status;

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
