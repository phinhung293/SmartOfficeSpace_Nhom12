package com.smartoffice.backend.component;

import com.smartoffice.backend.entities.*;
import com.smartoffice.backend.repositories.*;
import com.smartoffice.backend.repositories.BookingStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository          roleRepository;
    private final UserRepository          userRepository;
    private final PasswordEncoder         passwordEncoder;
    private final RoomRepository          roomRepository;
    private final RoomStatusRepository    roomStatusRepository;
    private final WorkspaceTypeRepository workspaceTypeRepository;
    private final AmenityRepository       amenityRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final BookingRepository       bookingRepository;

    @Override
    public void run(String... args) throws Exception {

        // ══════════════════════════════════════════════
        // 1. KHỞI TẠO QUYỀN (ADMIN / CUSTOMER)
        // ══════════════════════════════════════════════
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, "ADMIN"));
            roleRepository.save(new Role(null, "CUSTOMER"));
            System.out.println(">> [DataSeeder] Đã khởi tạo 2 quyền: ADMIN, CUSTOMER");
        }

        // ══════════════════════════════════════════════
        // 1b. KHỞI TẠO TRẠNG THÁI BOOKING (tiếng Việt)
        // ══════════════════════════════════════════════
        if (bookingStatusRepository.count() == 0) {
            bookingStatusRepository.save(newBookingStatus("PENDING_PAYMENT"));
            bookingStatusRepository.save(newBookingStatus("CONFIRMED"));
            bookingStatusRepository.save(newBookingStatus("CANCELLED"));
            bookingStatusRepository.save(newBookingStatus("EXPIRED"));
            System.out.println(">> [DataSeeder] Đã khởi tạo 4 trạng thái booking.");
        }

        List<Role> allRoles   = roleRepository.findAll();
        Role adminRole        = allRoles.stream().filter(r -> r.getRoleName().equalsIgnoreCase("ADMIN")).findFirst().orElse(null);
        Role customerRole     = allRoles.stream().filter(r -> r.getRoleName().equalsIgnoreCase("CUSTOMER")).findFirst().orElse(null);

        // ══════════════════════════════════════════════
        // 2. KHỞI TẠO TÀI KHOẢN MẪU
        // ══════════════════════════════════════════════
        if (adminRole != null && !userRepository.existsByEmail("admin@gmail.com")) {
            userRepository.save(User.builder()
                    .name("Admin")
                    .email("admin@gmail.com")
                    .phone("0912345678")
                    .password(passwordEncoder.encode("admin@123"))
                    .status("ACTIVE")
                    .role(adminRole)
                    .build());
            System.out.println(">> [DataSeeder] Đã tạo tài khoản Admin.");
        }

        // Tài khoản khách hàng mẫu — 6 người để tạo booking giả
        String[][] customers = {
                {"Nguyễn Văn An",    "nguyenvanan@gmail.com",    "0901111111", "AnNV@123"},
                {"Trần Thị Bích",    "tranthibich@gmail.com",    "0902222222", "BichTT@123"},
                {"Lê Văn Cường",     "levancuong@gmail.com",     "0903333333", "CuongLV@123"},
                {"Phạm Thị Diệu",    "phamthidieu@gmail.com",    "0904444444", "DieuPT@123"},
                {"Hoàng Văn Em",     "hoangvanem@gmail.com",     "0905555555", "EmHV@123"},
                {"Nguyễn Thị Phúc",  "nguyenthiphuc@gmail.com",  "0906666666", "PhucNT@123"},
        };

        if (customerRole != null) {
            for (String[] c : customers) {
                if (!userRepository.existsByEmail(c[1])) {
                    userRepository.save(User.builder()
                            .name(c[0]).email(c[1]).phone(c[2])
                            .password(passwordEncoder.encode(c[3]))
                            .status("ACTIVE").role(customerRole).build());
                }
            }
            System.out.println(">> [DataSeeder] Đã tạo 6 tài khoản khách hàng mẫu.");
        }

        // ══════════════════════════════════════════════
        // 3. KHỞI TẠO TRẠNG THÁI PHÒNG
        // ══════════════════════════════════════════════
        if (roomStatusRepository.count() == 0) {
            roomStatusRepository.save(newStatus("Còn trống"));   // id=1
            roomStatusRepository.save(newStatus("Đang bận"));    // id=2
            roomStatusRepository.save(newStatus("Bảo trì"));     // id=3
            System.out.println(">> [DataSeeder] Đã khởi tạo trạng thái phòng.");
        }

        // ══════════════════════════════════════════════
        // 4. KHỞI TẠO LOẠI KHÔNG GIAN
        // ══════════════════════════════════════════════
        if (workspaceTypeRepository.count() == 0) {
            workspaceTypeRepository.save(newType("Phòng họp"));
            workspaceTypeRepository.save(newType("Phòng làm việc"));
            workspaceTypeRepository.save(newType("Coworking"));
            System.out.println(">> [DataSeeder] Đã khởi tạo loại không gian.");
        }

        // ══════════════════════════════════════════════
        // 5. KHỞI TẠO TIỆN ÍCH
        // ══════════════════════════════════════════════
        if (amenityRepository.count() == 0) {
            amenityRepository.save(newAmenity("Máy lạnh"));
            amenityRepository.save(newAmenity("Nước uống"));
            amenityRepository.save(newAmenity("Wi-Fi"));
            amenityRepository.save(newAmenity("TV"));
            amenityRepository.save(newAmenity("Whiteboard"));
            amenityRepository.save(newAmenity("Máy chiếu"));
            amenityRepository.save(newAmenity("Bãi xe"));
            amenityRepository.save(newAmenity("Điều hòa"));
            System.out.println(">> [DataSeeder] Đã khởi tạo tiện ích phòng.");
        }

        // ══════════════════════════════════════════════
        // 6. KHỞI TẠO DỮ LIỆU PHÒNG (12 phòng)
        // ══════════════════════════════════════════════
        if (roomRepository.count() == 0) {
            List<RoomStatus>    statuses  = roomStatusRepository.findAll();
            List<WorkspaceType> types     = workspaceTypeRepository.findAll();
            List<Amenity>       amenities = amenityRepository.findAll();

            RoomStatus conTrong = statuses.stream().filter(s -> s.getStatusName().equals("Còn trống")).findFirst().orElse(null);
            RoomStatus dangBan  = statuses.stream().filter(s -> s.getStatusName().equals("Đang bận")).findFirst().orElse(null);
            RoomStatus baoTri   = statuses.stream().filter(s -> s.getStatusName().equals("Bảo trì")).findFirst().orElse(null);

            WorkspaceType phongHop     = types.stream().filter(t -> t.getTypeName().equals("Phòng họp")).findFirst().orElse(null);
            WorkspaceType phongLamViec = types.stream().filter(t -> t.getTypeName().equals("Phòng làm việc")).findFirst().orElse(null);
            WorkspaceType coworking    = types.stream().filter(t -> t.getTypeName().equals("Coworking")).findFirst().orElse(null);

            Amenity mayLanh    = find(amenities, "Máy lạnh");
            Amenity nuocUong   = find(amenities, "Nước uống");
            Amenity wifi       = find(amenities, "Wi-Fi");
            Amenity tv         = find(amenities, "TV");
            Amenity whiteboard = find(amenities, "Whiteboard");
            Amenity mayChieu   = find(amenities, "Máy chiếu");
            Amenity baiXe      = find(amenities, "Bãi xe");
            Amenity dieuHoa    = find(amenities, "Điều hòa");

            // ── PHÒNG HỌP ──────────────────────────────
            roomRepository.save(buildRoom("Phòng họp View City", phongHop, conTrong,
                    6, new BigDecimal("200000"), "Phòng 801, Tầng 08",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng họp View City được thiết kế hiện đại với tầm nhìn tuyệt đẹp ra thành phố. " +
                            "Trang thiết bị đầy đủ, hỗ trợ cuộc họp chuyên nghiệp: TV 55 inch, máy chiếu HD, " +
                            "bảng trắng kích thước lớn, bàn hình chữ nhật dài phù hợp cho 6 người.",
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
                    List.of(mayLanh, nuocUong, wifi, tv, whiteboard, mayChieu)));

            roomRepository.save(buildRoom("Phòng họp Executive", phongHop, conTrong,
                    10, new BigDecimal("750000"), "Phòng 1001, Tầng 10",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng họp cao cấp dành cho các buổi gặp gỡ đối tác và lãnh đạo. Nội thất sang trọng, " +
                            "bàn gỗ tự nhiên, ghế da cao cấp. Dịch vụ đón tiếp và nước uống chuyên nghiệp.",
                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)));

            roomRepository.save(buildRoom("Hội trường Toàn Cảnh", phongHop, dangBan,
                    30, new BigDecimal("800000"), "Phòng 1201, Tầng 12",
                    LocalTime.of(8,0), LocalTime.of(20,0),
                    "Hội trường hiện đại với sức chứa lớn, lý tưởng cho hội nghị, đào tạo và sự kiện nội bộ. " +
                            "Hệ thống âm thanh, ánh sáng chuyên nghiệp. Tầm nhìn panorama ra toàn thành phố.",
                    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800",
                    List.of(mayLanh, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)));

            roomRepository.save(buildRoom("Phòng họp Sáng Tạo", phongHop, conTrong,
                    8, new BigDecimal("350000"), "Phòng 502, Tầng 05",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian họp rộng rãi với thiết kế năng động, phù hợp cho các buổi brainstorm và workshop nhóm. " +
                            "Trang bị đầy đủ bảng trắng lớn, máy chiếu full HD, âm thanh hội nghị chuyên nghiệp.",
                    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard, mayChieu)));

            // ── PHÒNG LÀM VIỆC RIÊNG ──────────────────
            roomRepository.save(buildRoom("Phòng làm việc riêng A", phongLamViec, conTrong,
                    4, new BigDecimal("600000"), "Phòng 301, Tầng 03",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng làm việc riêng lý tưởng cho nhóm startup 2-4 người. Thiết kế mở, tạo cảm giác thoải mái " +
                            "và sáng tạo. Có thể đặt theo ngày hoặc theo tháng.",
                    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard)));

            roomRepository.save(buildRoom("Văn phòng Mini B", phongLamViec, conTrong,
                    1, new BigDecimal("80000"), "Phòng 201, Tầng 02",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian làm việc riêng tư, yên tĩnh cho 1 người. Phù hợp cho freelancer và " +
                            "chuyên gia làm việc độc lập. Trang bị đầy đủ bàn ghế ergonomic, đèn chiếu sáng tốt.",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
                    List.of(mayLanh, wifi)));

            roomRepository.save(buildRoom("Suite Làm Việc C", phongLamViec, dangBan,
                    15, new BigDecimal("400000"), "Phòng 601, Tầng 06",
                    LocalTime.of(8,0), LocalTime.of(22,0),
                    "Suite văn phòng rộng rãi với khu vực làm việc mở và phòng họp riêng nhỏ bên trong. " +
                            "Phù hợp cho doanh nghiệp vừa và nhỏ cần không gian làm việc linh hoạt.",
                    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, baiXe)));

            roomRepository.save(buildRoom("Văn phòng Góc Xanh D", phongLamViec, baoTri,
                    6, new BigDecimal("180000"), "Phòng 202, Tầng 02",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian làm việc có nhiều cây xanh, tạo cảm giác tươi mát và thư giãn. " +
                            "Hiện đang được nâng cấp trang thiết bị, dự kiến hoàn thành sớm.",
                    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
                    List.of(mayLanh, wifi)));

            // ── COWORKING ──────────────────────────────
            roomRepository.save(buildRoom("Bàn làm việc chung A", coworking, conTrong,
                    1, new BigDecimal("100000"), "Tầng 01 - Khu A",
                    LocalTime.of(6,0), LocalTime.of(23,0),
                    "Không gian coworking năng động với nhiều chỗ ngồi linh hoạt. Lý tưởng cho freelancer, " +
                            "sinh viên và startup. Có khu vực cà phê, lounge và phòng điện thoại riêng.",
                    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
                    List.of(mayLanh, nuocUong, wifi, baiXe)));

            roomRepository.save(buildRoom("Bàn làm việc chung B", coworking, conTrong,
                    1, new BigDecimal("100000"), "Tầng 01 - Khu B",
                    LocalTime.of(6,0), LocalTime.of(23,0),
                    "Bàn làm việc chung tiêu chuẩn với đầy đủ ổ cắm và ánh sáng tốt. " +
                            "Môi trường yên tĩnh, phù hợp làm việc tập trung cả ngày.",
                    "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800",
                    List.of(mayLanh, wifi)));

            roomRepository.save(buildRoom("Phòng họp nhỏ", coworking, conTrong,
                    4, new BigDecimal("150000"), "Tầng 09 - Khu VIP",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Coworking cao cấp dành cho doanh nhân và chuyên gia. Nội thất sang trọng, " +
                            "dịch vụ lễ tân hỗ trợ, tủ đồ riêng cá nhân. Phòng họp ưu tiên cho thành viên premium.",
                    "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)));

            roomRepository.save(buildRoom("Coworking Sáng", coworking, dangBan,
                    50, new BigDecimal("70000"), "Tầng 01 - Khu C",
                    LocalTime.of(6,0), LocalTime.of(22,0),
                    "Không gian coworking lớn nhất tòa nhà với đầy đủ tiện nghi. Phòng in ấn, " +
                            "tủ cá nhân, khu vực thư giãn. Phù hợp cho cộng đồng làm việc năng động.",
                    "https://images.unsplash.com/photo-1497366858526-0766e2d73896?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard, baiXe)));

            System.out.println(">> [DataSeeder] Đã khởi tạo 12 phòng mẫu thành công!");
        }

        // ══════════════════════════════════════════════
        // 7. KHỞI TẠO DỮ LIỆU BOOKING GIẢ (24 đơn)
        //    Bao gồm nhiều ngày, nhiều trạng thái, hôm nay có booking
        // ══════════════════════════════════════════════
        if (bookingRepository.count() == 0) {
            List<Room>          rooms    = roomRepository.findAll();
            List<User>          users    = userRepository.findAll();
            BookingStatus pendingPayment = bookingStatusRepository.findByStatusName("PENDING_PAYMENT").orElse(null);
            BookingStatus confirmed      = bookingStatusRepository.findByStatusName("CONFIRMED").orElse(null);
            BookingStatus cancelled      = bookingStatusRepository.findByStatusName("CANCELLED").orElse(null);
            BookingStatus expired        = bookingStatusRepository.findByStatusName("EXPIRED").orElse(null);

            if (rooms.size() < 6 || users.size() < 4) {
                System.out.println(">> [DataSeeder] Chưa đủ phòng/user để tạo booking mẫu.");
                return;
            }

            // Lấy room theo tên để tạo booking có tên đúng như trong hình
            Room viewCity   = findRoom(rooms, "Phòng họp View City");
            Room executive  = findRoom(rooms, "Phòng họp Executive");
            Room riengA     = findRoom(rooms, "Phòng làm việc riêng A");
            Room banChungA  = findRoom(rooms, "Bàn làm việc chung A");
            Room banChungB  = findRoom(rooms, "Bàn làm việc chung B");
            Room phongHopNho = findRoom(rooms, "Phòng họp nhỏ");

            // Users (lấy theo thứ tự: index 0=admin, 1-6=customers)
            List<User> customers2 = users.stream()
                    .filter(u -> u.getRole() != null && "CUSTOMER".equals(u.getRole().getRoleName()))
                    .toList();

            if (customers2.size() < 6 || viewCity == null) {
                System.out.println(">> [DataSeeder] Thiếu user/phòng cụ thể để seed booking.");
                return;
            }

            User userA = customers2.get(0); // Nguyễn Văn An
            User userB = customers2.get(1); // Trần Thị Bích
            User userC = customers2.get(2); // Lê Văn Cường
            User userD = customers2.get(3); // Phạm Thị Diệu
            User userE = customers2.get(4); // Hoàng Văn Em
            User userF = customers2.get(5); // Nguyễn Thị Phúc

            // Hôm nay (2026-05-25)
            LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

            // === BOOKING HÔM NAY (cho dashboard tổng quan) ===
            bookingRepository.save(buildBooking("WS260525-001", userA, viewCity,
                    today.withHour(9), today.withHour(11),
                    new BigDecimal("420000"), pendingPayment));

            bookingRepository.save(buildBooking("WS260525-002", userB, executive,
                    today.withHour(10), today.withHour(13),
                    new BigDecimal("750000"), confirmed));

            bookingRepository.save(buildBooking("WS260525-003", userC, riengA,
                    today.withHour(14), today.withHour(17),
                    new BigDecimal("600000"), confirmed));

            bookingRepository.save(buildBooking("WS260525-004", userD, banChungA,
                    today.withHour(9), today.withHour(10),
                    new BigDecimal("200000"), pendingPayment));

            // === BOOKING HÔM QUA ===
            LocalDateTime yesterday = today.minusDays(1);
            bookingRepository.save(buildBooking("WS260524-001", userE, viewCity,
                    yesterday.withHour(13), yesterday.withHour(15),
                    new BigDecimal("400000"), cancelled));

            bookingRepository.save(buildBooking("WS260524-002", userF, executive,
                    yesterday.withHour(8).withMinute(30), yesterday.withHour(11).withMinute(30),
                    new BigDecimal("750000"), confirmed));

            bookingRepository.save(buildBooking("WS260524-003", userA, phongHopNho,
                    yesterday.withHour(10), yesterday.withHour(12),
                    new BigDecimal("300000"), confirmed));

            bookingRepository.save(buildBooking("WS260524-004", userB, banChungB,
                    yesterday.withHour(9), yesterday.withHour(11),
                    new BigDecimal("200000"), expired));

            // === BOOKING 2 NGÀY TRƯỚC ===
            LocalDateTime day2 = today.minusDays(2);
            bookingRepository.save(buildBooking("WS260523-001", userC, viewCity,
                    day2.withHour(9), day2.withHour(11),
                    new BigDecimal("420000"), confirmed));

            bookingRepository.save(buildBooking("WS260523-002", userD, executive,
                    day2.withHour(14), day2.withHour(17),
                    new BigDecimal("750000"), confirmed));

            bookingRepository.save(buildBooking("WS260523-003", userE, riengA,
                    day2.withHour(10), day2.withHour(12),
                    new BigDecimal("600000"), cancelled));

            bookingRepository.save(buildBooking("WS260523-004", userF, banChungA,
                    day2.withHour(9), day2.withHour(10),
                    new BigDecimal("100000"), confirmed));

            // === BOOKING 3 NGÀY TRƯỚC ===
            LocalDateTime day3 = today.minusDays(3);
            bookingRepository.save(buildBooking("WS260522-001", userA, phongHopNho,
                    day3.withHour(8), day3.withHour(10),
                    new BigDecimal("300000"), confirmed));

            bookingRepository.save(buildBooking("WS260522-002", userB, viewCity,
                    day3.withHour(13), day3.withHour(15),
                    new BigDecimal("420000"), confirmed));

            bookingRepository.save(buildBooking("WS260522-003", userC, executive,
                    day3.withHour(10), day3.withHour(12),
                    new BigDecimal("750000"), pendingPayment));

            bookingRepository.save(buildBooking("WS260522-004", userD, banChungB,
                    day3.withHour(14), day3.withHour(16),
                    new BigDecimal("200000"), confirmed));

            // === BOOKING 1 TUẦN TRƯỚC ===
            LocalDateTime week1 = today.minusDays(7);
            bookingRepository.save(buildBooking("WS260518-001", userE, viewCity,
                    week1.withHour(9), week1.withHour(11),
                    new BigDecimal("420000"), confirmed));

            bookingRepository.save(buildBooking("WS260518-002", userF, executive,
                    week1.withHour(14), week1.withHour(18),
                    new BigDecimal("1000000"), confirmed));

            bookingRepository.save(buildBooking("WS260518-003", userA, riengA,
                    week1.withHour(8), week1.withHour(12),
                    new BigDecimal("600000"), cancelled));

            bookingRepository.save(buildBooking("WS260518-004", userB, banChungA,
                    week1.withHour(9), week1.withHour(11),
                    new BigDecimal("200000"), expired));

            // === BOOKING TƯƠNG LAI (để test) ===
            LocalDateTime tomorrow = today.plusDays(1);
            bookingRepository.save(buildBooking("WS260526-001", userC, viewCity,
                    tomorrow.withHour(10), tomorrow.withHour(12),
                    new BigDecimal("420000"), pendingPayment));

            bookingRepository.save(buildBooking("WS260526-002", userD, executive,
                    tomorrow.withHour(14), tomorrow.withHour(17),
                    new BigDecimal("750000"), confirmed));

            bookingRepository.save(buildBooking("WS260526-003", userE, phongHopNho,
                    tomorrow.withHour(9), tomorrow.withHour(11),
                    new BigDecimal("300000"), confirmed));

            LocalDateTime day4 = today.plusDays(4);
            bookingRepository.save(buildBooking("WS260529-001", userF, viewCity,
                    day4.withHour(9), day4.withHour(11),
                    new BigDecimal("420000"), pendingPayment));

            System.out.println(">> [DataSeeder] Đã khởi tạo 24 booking mẫu thành công!");
        }
    }

    // ── Helper finders ────────────────────────────────────────────────
    private Amenity find(List<Amenity> list, String name) {
        return list.stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
    }

    private Room findRoom(List<Room> list, String name) {
        return list.stream().filter(r -> r.getName().equals(name)).findFirst().orElse(null);
    }

    // ── Helper builders ───────────────────────────────────────────────
    private RoomStatus newStatus(String name) {
        RoomStatus s = new RoomStatus(); s.setStatusName(name); return s;
    }
    private BookingStatus newBookingStatus(String name) {
        BookingStatus s = new BookingStatus(); s.setStatusName(name); return s;
    }
    private WorkspaceType newType(String name) {
        WorkspaceType t = new WorkspaceType(); t.setTypeName(name); return t;
    }
    private Amenity newAmenity(String name) {
        Amenity a = new Amenity(); a.setName(name); return a;
    }

    private Room buildRoom(String name, WorkspaceType type, RoomStatus status,
                           int capacity, BigDecimal price, String location,
                           LocalTime open, LocalTime close,
                           String desc, String imageUrl, List<Amenity> amenities) {
        Room r = new Room();
        r.setName(name);
        r.setWorkspaceType(type);
        r.setRoomStatus(status);
        r.setCapacity(capacity);
        r.setPrice(price);
        r.setLocation(location);
        r.setOpenTime(open);
        r.setCloseTime(close);
        r.setDescription(desc);
        r.setImageUrl(imageUrl);
        r.setAmenities(amenities);
        return r;
    }

    private Booking buildBooking(String bookingCode, User user, Room room,
                                 LocalDateTime start, LocalDateTime end,
                                 BigDecimal totalAmount, BookingStatus status) {
        if (room == null || user == null || status == null) return null;
        Booking b = new Booking();
        b.setBookingCode(bookingCode);
        b.setUser(user);
        b.setRoom(room);
        b.setStartTime(start);
        b.setEndTime(end);
        b.setTotalAmount(totalAmount);
        b.setBookingStatus(status);
        b.setCreatedAt(start.minusHours(2));
        // PENDING_PAYMENT → lock 5 phút từ lúc tạo
        if ("PENDING_PAYMENT".equals(status.getStatusName())) {
            b.setLockedUntil(b.getCreatedAt().plusMinutes(30)); // 30 phút cho dữ liệu demo
        }
        return b;
    }
}