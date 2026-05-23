package com.smartoffice.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Rooms")
@Data
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoomID")
    private Integer roomId;

    @Column(name = "Name", nullable = false, length = 50)
    private String name;

    @Column(name = "Capacity", nullable = false)
    private Integer capacity;

    @Column(name = "Price", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price;

    @Column(name = "Description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "StatusID", nullable = false)
    private RoomStatus roomStatus;

    @ManyToOne
    @JoinColumn(name = "TypeID", nullable = false)
    private WorkspaceType workspaceType;

    @ManyToMany
    @JoinTable(
            name = "roomamenities", // Đây chính là bảng số 10 trong SQL của bạn
            joinColumns = @JoinColumn(name = "RoomID"),
            inverseJoinColumns = @JoinColumn(name = "AmenityID")
    )
    private java.util.List<Amenity> amenities;
}
