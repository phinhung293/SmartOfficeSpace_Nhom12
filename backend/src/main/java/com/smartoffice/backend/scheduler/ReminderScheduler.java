package com.smartoffice.backend.scheduler;

import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // Chạy mỗi 5 phút, tìm booking CONFIRMED sắp bắt đầu trong 30-35 phút
    @Scheduled(fixedDelay = 300_000)
    public void sendReminders() {
        LocalDateTime from = LocalDateTime.now().plusMinutes(30);
        LocalDateTime to   = LocalDateTime.now().plusMinutes(35);

        List<Booking> upcoming = bookingRepository.findUpcomingConfirmed(from, to);
        for (Booking b : upcoming) {
            notificationService.onBookingReminder(b);
            log.info("Đã nhắc lịch booking {} cho {}", b.getBookingCode(), b.getUser().getEmail());
        }
    }
}