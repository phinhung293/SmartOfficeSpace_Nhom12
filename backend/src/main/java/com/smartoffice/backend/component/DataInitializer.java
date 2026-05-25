package com.smartoffice.backend.component;

import com.smartoffice.backend.entities.*;
import com.smartoffice.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository         roleRepository;
    private final UserRepository         userRepository;
    private final PasswordEncoder        passwordEncoder;
    private final RoomRepository         roomRepository;
    private final RoomStatusRepository   roomStatusRepository;
    private final WorkspaceTypeRepository workspaceTypeRepository;
    private final AmenityRepository      amenityRepository;

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
        if (customerRole != null && !userRepository.existsByEmail("test1@gmail.com")) {
            userRepository.save(User.builder()
                    .name("Lâm Phi Nhung")
                    .email("test1@gmail.com")
                    .phone("0987654321")
                    .password(passwordEncoder.encode("Nhung@123"))
                    .status("ACTIVE")
                    .role(customerRole)
                    .build());
            System.out.println(">> [DataSeeder] Đã tạo tài khoản khách hàng mẫu.");
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
        // 4. KHỞI TẠO LOẠI KHÔNG GIAN (tiếng Việt)
        // ══════════════════════════════════════════════
        if (workspaceTypeRepository.count() == 0) {
            workspaceTypeRepository.save(newType("Phòng họp"));       // id=1
            workspaceTypeRepository.save(newType("Phòng làm việc")); // id=2
            workspaceTypeRepository.save(newType("Coworking"));       // id=3
            System.out.println(">> [DataSeeder] Đã khởi tạo loại không gian.");
        }

        // ══════════════════════════════════════════════
        // 5. KHỞI TẠO TIỆN ÍCH
        // ══════════════════════════════════════════════
        if (amenityRepository.count() == 0) {
            amenityRepository.save(newAmenity("Máy lạnh"));     // id=1
            amenityRepository.save(newAmenity("Nước uống"));    // id=2
            amenityRepository.save(newAmenity("Wi-Fi"));        // id=3
            amenityRepository.save(newAmenity("TV"));           // id=4
            amenityRepository.save(newAmenity("Whiteboard"));   // id=5
            amenityRepository.save(newAmenity("Máy chiếu"));    // id=6
            amenityRepository.save(newAmenity("Bãi xe"));       // id=7
            amenityRepository.save(newAmenity("Điều hòa"));     // id=8
            System.out.println(">> [DataSeeder] Đã khởi tạo tiện ích phòng.");
        }

        // ══════════════════════════════════════════════
        // 6. KHỞI TẠO DỮ LIỆU PHÒNG
        //    — bao phủ đầy đủ các trường hợp tìm kiếm:
        //      loại phòng, sức chứa, giá, tiện ích, trạng thái
        // ══════════════════════════════════════════════
        if (roomRepository.count() == 0) {
            List<RoomStatus>    statuses = roomStatusRepository.findAll();
            List<WorkspaceType> types    = workspaceTypeRepository.findAll();
            List<Amenity>       amenities = amenityRepository.findAll();

            RoomStatus conTrong = statuses.stream().filter(s -> s.getStatusName().equals("Còn trống")).findFirst().orElse(null);
            RoomStatus dangBan  = statuses.stream().filter(s -> s.getStatusName().equals("Đang bận")).findFirst().orElse(null);
            RoomStatus baoTri   = statuses.stream().filter(s -> s.getStatusName().equals("Bảo trì")).findFirst().orElse(null);

            WorkspaceType phongHop      = types.stream().filter(t -> t.getTypeName().equals("Phòng họp")).findFirst().orElse(null);
            WorkspaceType phongLamViec  = types.stream().filter(t -> t.getTypeName().equals("Phòng làm việc")).findFirst().orElse(null);
            WorkspaceType coworking     = types.stream().filter(t -> t.getTypeName().equals("Coworking")).findFirst().orElse(null);

            Amenity mayLanh    = amenities.stream().filter(a -> a.getName().equals("Máy lạnh")).findFirst().orElse(null);
            Amenity nuocUong   = amenities.stream().filter(a -> a.getName().equals("Nước uống")).findFirst().orElse(null);
            Amenity wifi       = amenities.stream().filter(a -> a.getName().equals("Wi-Fi")).findFirst().orElse(null);
            Amenity tv         = amenities.stream().filter(a -> a.getName().equals("TV")).findFirst().orElse(null);
            Amenity whiteboard = amenities.stream().filter(a -> a.getName().equals("Whiteboard")).findFirst().orElse(null);
            Amenity mayChieu   = amenities.stream().filter(a -> a.getName().equals("Máy chiếu")).findFirst().orElse(null);
            Amenity baiXe      = amenities.stream().filter(a -> a.getName().equals("Bãi xe")).findFirst().orElse(null);
            Amenity dieuHoa    = amenities.stream().filter(a -> a.getName().equals("Điều hòa")).findFirst().orElse(null);

            // ── PHÒNG HỌP ──────────────────────────────────────────────
            // P1: Phòng họp nhỏ, giá rẻ, còn trống
            roomRepository.save(buildRoom(
                    "Phòng họp View City", phongHop, conTrong,
                    6, new BigDecimal("200000"),
                    "Phòng 801, Tầng 08",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng họp View City được thiết kế hiện đại với tầm nhìn tuyệt đẹp ra thành phố. " +
                            "Trang thiết bị đầy đủ, hỗ trợ cuộc họp chuyên nghiệp: TV 55 inch, máy chiếu HD, " +
                            "bảng trắng với kích thước lớn, bàn hình chữ nhật dài phù hợp cho 6 người.",
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
                    List.of(mayLanh, nuocUong, wifi, tv, whiteboard, mayChieu)
            ));

            // P2: Phòng họp trung bình, giá trung bình, còn trống
            roomRepository.save(buildRoom(
                    "Phòng họp Sáng Tạo", phongHop, conTrong,
                    10, new BigDecimal("350000"),
                    "Phòng 502, Tầng 05",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian họp rộng rãi với thiết kế năng động, phù hợp cho các buổi brainstorm và workshop nhóm. " +
                            "Trang bị đầy đủ bảng trắng lớn, máy chiếu full HD, âm thanh hội nghị chuyên nghiệp.",
                    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard, mayChieu)
            ));

            // P3: Phòng họp lớn, giá cao, đang bận
            roomRepository.save(buildRoom(
                    "Hội trường Toàn Cảnh", phongHop, dangBan,
                    30, new BigDecimal("800000"),
                    "Phòng 1201, Tầng 12",
                    LocalTime.of(8,0), LocalTime.of(20,0),
                    "Hội trường hiện đại với sức chứa lớn, lý tưởng cho hội nghị, đào tạo và sự kiện nội bộ. " +
                            "Hệ thống âm thanh, ánh sáng chuyên nghiệp. Tầm nhìn panorama ra toàn thành phố.",
                    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800",
                    List.of(mayLanh, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)
            ));

            // P4: Phòng họp VIP, giá rất cao, còn trống
            roomRepository.save(buildRoom(
                    "Phòng họp Executive", phongHop, conTrong,
                    8, new BigDecimal("600000"),
                    "Phòng 1001, Tầng 10",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng họp cao cấp dành cho các buổi gặp gỡ đối tác và lãnh đạo. Nội thất sang trọng, " +
                            "bàn gỗ tự nhiên, ghế da cao cấp. Dịch vụ đón tiếp và nước uống chuyên nghiệp.",
                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)
            ));

            // ── PHÒNG LÀM VIỆC RIÊNG ───────────────────────────────────
            // P5: Văn phòng nhỏ 1 người, giá thấp, còn trống
            roomRepository.save(buildRoom(
                    "Văn phòng Mini A1", phongLamViec, conTrong,
                    1, new BigDecimal("80000"),
                    "Phòng 301, Tầng 03",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian làm việc riêng tư, yên tĩnh cho 1 người. Phù hợp cho freelancer và " +
                            "chuyên gia làm việc độc lập. Trang bị đầy đủ bàn ghế ergonomic, đèn chiếu sáng tốt.",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
                    List.of(mayLanh, wifi)
            ));

            // P6: Văn phòng nhóm nhỏ, giá trung bình, còn trống
            roomRepository.save(buildRoom(
                    "Văn phòng Startup B2", phongLamViec, conTrong,
                    4, new BigDecimal("150000"),
                    "Phòng 401, Tầng 04",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Phòng làm việc riêng lý tưởng cho nhóm startup 2-4 người. Thiết kế mở, tạo cảm giác thoải mái " +
                            "và sáng tạo. Có thể đặt theo ngày hoặc theo tháng.",
                    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard)
            ));

            // P7: Văn phòng nhóm trung, giá cao, đang bận
            roomRepository.save(buildRoom(
                    "Suite Làm Việc C3", phongLamViec, dangBan,
                    15, new BigDecimal("400000"),
                    "Phòng 601, Tầng 06",
                    LocalTime.of(8,0), LocalTime.of(22,0),
                    "Suite văn phòng rộng rãi với khu vực làm việc mở và phòng họp riêng nhỏ bên trong. " +
                            "Phù hợp cho doanh nghiệp vừa và nhỏ cần không gian làm việc linh hoạt.",
                    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, baiXe)
            ));

            // P8: Văn phòng, bảo trì
            roomRepository.save(buildRoom(
                    "Văn phòng Góc Xanh D4", phongLamViec, baoTri,
                    6, new BigDecimal("180000"),
                    "Phòng 202, Tầng 02",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Không gian làm việc có nhiều cây xanh, tạo cảm giác tươi mát và thư giãn. " +
                            "Hiện đang được nâng cấp trang thiết bị, dự kiến hoàn thành sớm.",
                    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
                    List.of(mayLanh, wifi)
            ));

            // ── COWORKING ───────────────────────────────────────────────
            // P9: Coworking nhỏ, giá rất rẻ, còn trống
            roomRepository.save(buildRoom(
                    "Khu Coworking Mở E1", coworking, conTrong,
                    20, new BigDecimal("50000"),
                    "Tầng 01 - Khu A",
                    LocalTime.of(6,0), LocalTime.of(23,0),
                    "Không gian coworking năng động với nhiều chỗ ngồi linh hoạt. Lý tưởng cho freelancer, " +
                            "sinh viên và startup. Có khu vực cà phê, lounge và phòng điện thoại riêng.",
                    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
                    List.of(mayLanh, nuocUong, wifi, baiXe)
            ));

            // P10: Coworking trung bình, giá trung bình, còn trống
            roomRepository.save(buildRoom(
                    "Coworking Sky Lounge F2", coworking, conTrong,
                    40, new BigDecimal("120000"),
                    "Tầng 09 - Khu B",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Khu coworking tầng cao với tầm nhìn đẹp, thiết kế hiện đại. Có phòng họp nhỏ miễn phí " +
                            "2 giờ/ngày cho thành viên. Khu ăn uống và vui chơi giải trí tiện lợi.",
                    "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, baiXe)
            ));

            // P11: Coworking cao cấp, giá cao, còn trống
            roomRepository.save(buildRoom(
                    "Premium Coworking G3", coworking, conTrong,
                    25, new BigDecimal("250000"),
                    "Tầng 11 - Khu VIP",
                    LocalTime.of(7,0), LocalTime.of(22,0),
                    "Coworking cao cấp dành cho doanh nhân và chuyên gia. Nội thất sang trọng, " +
                            "dịch vụ lễ tân hỗ trợ, tủ đồ riêng cá nhân. Phòng họp ưu tiên cho thành viên premium.",
                    "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800",
                    List.of(dieuHoa, nuocUong, wifi, tv, whiteboard, mayChieu, baiXe)
            ));

            // P12: Coworking, đang bận
            roomRepository.save(buildRoom(
                    "Coworking Sáng H4", coworking, dangBan,
                    50, new BigDecimal("70000"),
                    "Tầng 01 - Khu C",
                    LocalTime.of(6,0), LocalTime.of(22,0),
                    "Không gian coworking lớn nhất tòa nhà với đầy đủ tiện nghi. Phòng in ấn, " +
                            "tủ cá nhân, khu vực thư giãn. Phù hợp cho cộng đồng làm việc năng động.",
                    "https://images.unsplash.com/photo-1497366858526-0766e2d73896?w=800",
                    List.of(mayLanh, nuocUong, wifi, whiteboard, baiXe)
            ));

            System.out.println(">> [DataSeeder] Đã khởi tạo 12 phòng mẫu thành công!");
        }
    }

    // ── Helper builders ──────────────────────────────
    private RoomStatus newStatus(String name) {
        RoomStatus s = new RoomStatus(); s.setStatusName(name); return s;
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
}
