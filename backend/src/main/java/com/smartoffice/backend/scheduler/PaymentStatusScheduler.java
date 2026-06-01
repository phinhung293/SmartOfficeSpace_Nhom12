package com.smartoffice.backend.scheduler;

import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.services.SepayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class PaymentStatusScheduler {
    private final BookingRepository bookingRepository;
    private final SepayService sepayService;

    /**
     * Mỗi 30 giây kiểm tra các booking PENDING_PAYMENT quá 30 phút và tự động expire
     */
    @Scheduled(fixedDelay = 30000)
    public void expireStaleBookings() {
        LocalDateTime expiryThreshold = LocalDateTime.now().minusMinutes(30);
        List<Booking> staleBookings = bookingRepository.findPendingPaymentOlderThan(expiryThreshold);

        for (Booking booking : staleBookings) {
            if (booking.getLockedUntil() != null && booking.getLockedUntil().isBefore(LocalDateTime.now())) {
                log.info("Expiring stale booking: {}", booking.getBookingCode());
                // Chuyển sang EXPIRED (cần thêm logic trong service)
            }
        }
    }
}
