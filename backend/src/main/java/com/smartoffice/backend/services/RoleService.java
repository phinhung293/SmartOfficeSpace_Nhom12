package com.smartoffice.backend.services;

import com.smartoffice.backend.entities.Role;
import com.smartoffice.backend.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    // Lấy tất cả các quyền
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
