package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.WorkspaceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceTypeRepository extends JpaRepository<WorkspaceType, Integer> {
}
