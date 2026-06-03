package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingStatusRepository extends JpaRepository<BookingStatus, Integer> {
    Optional<BookingStatus> findByStatusName(String statusName);
}
