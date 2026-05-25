package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "workspaceTypes")
@Data
public class WorkspaceType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TypeID")
    private Integer typeId;

    @Column(name = "TypeName", nullable = false, length = 30)
    private String typeName;
}
