package com.smartoffice.backend.scheduler;

import com.smartoffice.backend.entities.BookingStatus;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.BookingStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Tự động expire các booking PENDING_PAYMENT đã hết thời gian giữ chỗ (5 phút).
 * Chạy mỗi 1 phút.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpireScheduler {

    private final BookingRepository bookingRepository;
    private final BookingStatusRepository bookingStatusRepository;

    @Scheduled(fixedDelay = 60_000) // mỗi 60 giây
    @Transactional
    public void expireStaleBookings() {
        BookingStatus expiredStatus = bookingStatusRepository
                .findByStatusName("EXPIRED")
                .orElse(null);

        if (expiredStatus == null) {
            log.warn("Trạng thái EXPIRED không tìm thấy trong DB, bỏ qua expire job.");
            return;
        }

        int count = bookingRepository.expireStaleBookings(LocalDateTime.now(), expiredStatus);
        if (count > 0) {
            log.info("Đã expire {} booking hết hạn giữ chỗ.", count);
        }
    }
}
