package com.smartoffice.backend.specifications;

import com.smartoffice.backend.entities.Room;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

public class RoomSpecification {

    // Search theo keyword
    public static Specification<Room> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isEmpty()) {
                return null;
            }
            return cb.like(
                    cb.lower(root.get("name")),
                    "%" + keyword.toLowerCase() + "%"
            );
        };
    }

    // Giá tối thiểu
    public static Specification<Room> hasMinPrice(BigDecimal minPrice) {
        return (root, query, cb) -> {
            if (minPrice == null) {
                return null;
            }
            return cb.greaterThanOrEqualTo(
                    root.get("price"),
                    minPrice
            );
        };
    }

    // Giá tối đa
    public static Specification<Room> hasMaxPrice(BigDecimal maxPrice) {
        return (root, query, cb) -> {
            if (maxPrice == null) {
                return null;
            }
            return cb.lessThanOrEqualTo(
                    root.get("price"),
                    maxPrice
            );
        };
    }

    // Capacity
    public static Specification<Room> hasCapacity(Integer capacity) {
        return (root, query, cb) -> {
            if (capacity == null) {
                return null;
            }
            return cb.greaterThanOrEqualTo(
                    root.get("capacity"),
                    capacity
            );
        };
    }

    // Workspace Type
    public static Specification<Room> hasWorkspaceType(Integer workspaceTypeId) {
        return (root, query, cb) -> {
            if (workspaceTypeId == null) {
                return null;
            }
            return cb.equal(
                    root.get("workspaceType").get("typeId"),
                    workspaceTypeId
            );
        };
    }

    // Amenities — filter theo tên (Khớp với logic DTO mới của nhánh booking)
    public static Specification<Room> hasAmenities(List<String> amenityNames) {
        return (root, query, cb) -> {
            if (amenityNames == null || amenityNames.isEmpty()) {
                return null;
            }

            query.distinct(true);
            Join<Object, Object> amenitiesJoin = root.join("amenities");

            return amenitiesJoin.get("name").in(amenityNames);
        };
    }

    // Room Status
    public static Specification<Room> hasStatus(Integer statusId) {
        return (root, query, cb) -> {
            if (statusId == null) {
                return null;
            }
            return cb.equal(
                    root.get("roomStatus").get("statusId"),
                    statusId
            );
        };
    }
}