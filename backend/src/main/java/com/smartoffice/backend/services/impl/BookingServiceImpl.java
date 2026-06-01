package com.smartoffice.backend.services.impl;

import com.smartoffice.backend.dto.booking.BookingRequest;
import com.smartoffice.backend.dto.booking.BookingResponse;
import com.smartoffice.backend.dto.booking.SlotStatusResponse;
import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.entities.BookingStatus;
import com.smartoffice.backend.entities.Room;
import com.smartoffice.backend.entities.User;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.BookingStatusRepository;
import com.smartoffice.backend.repositories.RoomRepository;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    // Thời gian giữ chỗ: 5 phút
    private static final int LOCK_MINUTES = 5;

    private final BookingRepository bookingRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    // ─── STATUS HELPERS ──────────────────────────────────────────────────────

    private BookingStatus getStatus(String name) {
        return bookingStatusRepository.findByStatusName(name)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trạng thái: " + name));
    }

    // ─── 1. TẠO BOOKING (COLLISION CHECK + PESSIMISTIC LOCK) ─────────────────

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Integer userId) {

        LocalDateTime startTime = LocalDateTime.of(request.getDate(), request.getStartTime());
        LocalDateTime endTime   = LocalDateTime.of(request.getDate(), request.getEndTime());

        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Không thể đặt phòng trong quá khứ.");
        }

        // Lấy Room — kiểm tra tồn tại
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại."));

        // ── COLLISION CHECK với PESSIMISTIC WRITE LOCK ──
        // Câu query này sẽ lock các rows liên quan cho đến hết transaction
        List<Booking> conflicts = bookingRepository.findOverlappingWithLock(
                request.getRoomId(), startTime, endTime
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for roomId={} from {} to {} by userId={}",
                    request.getRoomId(), startTime, endTime, userId);
            throw new RuntimeException(
                    "Phòng đang được người khác đặt trong khung giờ này. Vui lòng chọn khung giờ khác."
            );
        }

        // ── Tính tiền ──
        long hours = java.time.Duration.between(startTime, endTime).toHours();
        BigDecimal totalAmount = room.getPrice().multiply(BigDecimal.valueOf(hours));

        // ── Tạo booking ──
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalAmount(totalAmount);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        booking.setBookingStatus(getStatus("PENDING_PAYMENT"));

        // Save trước để lấy ID cho bookingCode
        Booking saved = bookingRepository.save(booking);

        // ── Sinh bookingCode: WS{YYMMDD}-{bookingId} — dùng ID tránh duplicate ──
        String datePart = request.getDate().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String prefix   = "WS" + datePart + "-";
        saved.setBookingCode(prefix + String.format("%03d", saved.getBookingId()));
        saved = bookingRepository.save(saved);

        log.info("Booking created: {} for room {} by user {}", saved.getBookingCode(),
                room.getName(), user.getEmail());

        return toResponse(saved);
    }

    // ─── 2. SLOT STATUS (booked / locked / free) ─────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public SlotStatusResponse getSlotStatus(Integer roomId, LocalDate date) {

        LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.of(8, 0));
        LocalDateTime dayEnd   = LocalDateTime.of(date, LocalTime.of(22, 0));

        List<Booking> dayBookings = bookingRepository.findBookingsForDay(roomId, dayStart, dayEnd);

        List<Integer> bookedSlots  = new ArrayList<>();
        List<Integer> lockedSlots  = new ArrayList<>();
        List<Integer> maintSlots   = new ArrayList<>();

        for (Booking b : dayBookings) {
            String statusName = b.getBookingStatus().getStatusName();
            List<Integer> slotIndexes = toSlotIndexes(b.getStartTime(), b.getEndTime(), date);

            switch (statusName) {
                case "CONFIRMED":
                    bookedSlots.addAll(slotIndexes);
                    break;
                case "PENDING_PAYMENT":
                    // Nếu chưa expire → locked; nếu đã expire → bỏ qua (scheduler sẽ xử lý)
                    if (b.getLockedUntil() != null && b.getLockedUntil().isAfter(LocalDateTime.now())) {
                        lockedSlots.addAll(slotIndexes);
                    }
                    break;
                default:
                    break;
            }
        }

        return new SlotStatusResponse(bookedSlots, maintSlots, lockedSlots);
    }

    /**
     * Chuyển startTime → endTime thành danh sách slot index (08:00=0, 09:00=1, ...)
     */
    private List<Integer> toSlotIndexes(LocalDateTime start, LocalDateTime end, LocalDate date) {
        List<Integer> indexes = new ArrayList<>();
        LocalTime s = start.toLocalTime();
        LocalTime e = end.toLocalTime();
        int base = 8; // slot 0 = 08:00
        for (int h = base; h < 22; h++) {
            LocalTime slotStart = LocalTime.of(h, 0);
            LocalTime slotEnd   = LocalTime.of(h + 1, 0);
            if (!slotStart.isBefore(s) && !slotEnd.isAfter(e)) {
                indexes.add(h - base);
            }
        }
        return indexes;
    }

    // ─── 3. MY BOOKINGS ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(Integer userId, Pageable pageable) {
        return bookingRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    // ─── 4. ADMIN — ALL BOOKINGS ─────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(String status, LocalDate dateFrom, LocalDate dateTo,
                                                String userKeyword, String roomKeyword, String bookingCode,
                                                Pageable pageable) {
        Specification<Booking> spec = (root, query, cb) -> null;

        if (status != null && !status.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("bookingStatus").get("statusName"), status));
        }
        // Lọc theo khoảng ngày dateFrom → dateTo
        if (dateFrom != null) {
            LocalDateTime from = dateFrom.atStartOfDay();
            spec = spec.and((root, q, cb) ->
                    cb.greaterThanOrEqualTo(root.get("startTime"), from));
        }
        if (dateTo != null) {
            LocalDateTime to = dateTo.plusDays(1).atStartOfDay();
            spec = spec.and((root, q, cb) ->
                    cb.lessThan(root.get("startTime"), to));
        }
        if (userKeyword != null && !userKeyword.isBlank()) {
            String like = "%" + userKeyword.toLowerCase() + "%";
            spec = spec.and((root, q, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("user").get("name")), like),
                            cb.like(cb.lower(root.get("user").get("email")), like)
                    ));
        }
        if (roomKeyword != null && !roomKeyword.isBlank()) {
            String like = "%" + roomKeyword.toLowerCase() + "%";
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("room").get("name")), like));
        }
        if (bookingCode != null && !bookingCode.isBlank()) {
            String like = "%" + bookingCode.toLowerCase() + "%";
            spec = spec.and((root, q, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("bookingCode")), like),
                            cb.like(cb.lower(root.get("user").get("name")), like),
                            cb.like(cb.lower(root.get("user").get("email")), like)
                    ));
        }

        return bookingRepository.findAll(spec, pageable).map(this::toResponse);
    }

    // ─── 5. ADMIN HỦY BOOKING ────────────────────────────────────────────────

    @Override
    @Transactional
    public BookingResponse cancelBooking(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        String currentStatus = booking.getBookingStatus().getStatusName();
        if ("CANCELLED".equals(currentStatus) || "EXPIRED".equals(currentStatus)) {
            throw new RuntimeException("Booking đã ở trạng thái " + currentStatus + ", không thể hủy.");
        }

        booking.setBookingStatus(getStatus("CANCELLED"));
        booking.setLockedUntil(null); // mở lock ngay
        return toResponse(bookingRepository.save(booking));
    }

    // ─── 6. ADMIN XÁC NHẬN THANH TOÁN ───────────────────────────────────────

    @Override
    @Transactional
    public BookingResponse confirmPayment(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking: " + bookingId));

        if (!"PENDING_PAYMENT".equals(booking.getBookingStatus().getStatusName())) {
            throw new RuntimeException("Chỉ có thể xác nhận thanh toán cho booking đang PENDING_PAYMENT.");
        }

        booking.setBookingStatus(getStatus("CONFIRMED"));
        booking.setLockedUntil(null);
        return toResponse(bookingRepository.save(booking));
    }

    // ─── MAP TO RESPONSE ─────────────────────────────────────────────────────

    private BookingResponse toResponse(Booking b) {
        BookingResponse r = new BookingResponse();

        r.setBookingId(b.getBookingId());
        r.setBookingCode(b.getBookingCode());

        r.setUserName(b.getUser().getName());
        r.setUserEmail(b.getUser().getEmail());
        r.setUserPhone(b.getUser().getPhone());

        r.setRoomName(b.getRoom().getName());
        r.setRoomImageUrl(b.getRoom().getImageUrl());

        if (b.getRoom().getWorkspaceType() != null) {
            r.setWorkspaceType(
                    b.getRoom().getWorkspaceType().getTypeName()
            );
        }

        r.setPricePerHour(b.getRoom().getPrice());
        r.setCapacity(b.getRoom().getCapacity());

        r.setStartTime(b.getStartTime());
        r.setEndTime(b.getEndTime());

        r.setTotalAmount(b.getTotalAmount());
        r.setStatus(b.getBookingStatus().getStatusName());
        r.setCreatedAt(b.getCreatedAt());

        if (b.getStartTime() != null && b.getEndTime() != null) {
            r.setDurationHours(
                    java.time.Duration
                            .between(b.getStartTime(), b.getEndTime())
                            .toHours()
            );
        }
        return r;
    }
    // ─── 7. ĐẾM ĐƠN HÔM NAY ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public long countTodayBookings(java.time.LocalDateTime dayStart, java.time.LocalDateTime dayEnd) {
        return bookingRepository.countTodayBookings(dayStart, dayEnd);
    }

    // ─── 8. DOANH THU HÔM NAY ────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public java.math.BigDecimal getTodayRevenue(java.time.LocalDateTime dayStart, java.time.LocalDateTime dayEnd) {
        Specification<Booking> spec = (root, query, cb) ->
                cb.and(
                        cb.between(root.get("startTime"), dayStart, dayEnd),
                        cb.equal(root.get("bookingStatus").get("statusName"), "CONFIRMED")
                );
        return bookingRepository.findAll(spec).stream()
                .map(Booking::getTotalAmount)
                .filter(a -> a != null)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }
    @Override
    public BookingResponse getMyBookingById(Integer bookingId, Integer userId) {

        Booking booking = bookingRepository
                .findByBookingIdAndUser_UserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        return toResponse(booking);
    }
    @Override
    @Transactional
    public BookingResponse cancelMyBooking(Integer bookingId, Integer userId) {

        Booking booking = bookingRepository
                .findByBookingIdAndUser_UserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        String status = booking.getBookingStatus().getStatusName();

        if ("CANCELLED".equals(status)) {
            throw new RuntimeException("Booking đã bị hủy.");
        }

        if ("COMPLETED".equals(status)) {
            throw new RuntimeException("Không thể hủy booking đã hoàn thành.");
        }

        booking.setBookingStatus(getStatus("CANCELLED"));
        booking.setLockedUntil(null);

        bookingRepository.save(booking);

        return toResponse(booking);
    }
}