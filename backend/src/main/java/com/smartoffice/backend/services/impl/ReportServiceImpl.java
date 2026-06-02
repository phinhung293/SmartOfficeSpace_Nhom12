package com.smartoffice.backend.services.impl;

import com.smartoffice.backend.dto.report.*;
import com.smartoffice.backend.entities.Booking;
import com.smartoffice.backend.entities.Room;
import com.smartoffice.backend.repositories.BookingRepository;
import com.smartoffice.backend.repositories.RoomRepository;
import com.smartoffice.backend.services.ReportService;
import com.smartoffice.backend.services.RoomService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final RoomService roomService;

    private static final int DAILY_WORKING_HOURS = 14; // From 8:00 to 22:00

    @Override
    public RevenueReportDto getRevenueReport(String type, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        // Get confirmed bookings in range
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingStatus().getStatusName().equals("CONFIRMED")
                        && !b.getStartTime().isBefore(start)
                        && b.getStartTime().isBefore(end))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = bookings.stream()
                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by period
        Map<String, List<Booking>> grouped = new HashMap<>();
        DateTimeFormatter formatter = getFormatter(type);

        bookings.forEach(b -> {
            String period = b.getStartTime().format(formatter);
            grouped.computeIfAbsent(period, k -> new ArrayList<>()).add(b);
        });

        // Fill empty periods
        List<RevenueDetailDto> details = new ArrayList<>();
        List<String> allPeriods = generatePeriods(type, from, to);

        for (String period : allPeriods) {
            List<Booking> list = grouped.getOrDefault(period, Collections.emptyList());
            BigDecimal rev = list.stream()
                    .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            details.add(new RevenueDetailDto(period, list.size(), rev));
        }

        // Sort details
        details.sort(Comparator.comparing(RevenueDetailDto::getPeriod));

        return new RevenueReportDto(totalRevenue, bookings.size(), details);
    }

    @Override
    public BookingReportDto getBookingReport(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> !b.getStartTime().isBefore(start) && b.getStartTime().isBefore(end))
                .collect(Collectors.toList());

        long total = bookings.size();
        long pending = bookings.stream().filter(b -> b.getBookingStatus().getStatusName().equals("PENDING_PAYMENT")).count();
        long confirmed = bookings.stream().filter(b -> b.getBookingStatus().getStatusName().equals("CONFIRMED")).count();
        long cancelled = bookings.stream().filter(b -> b.getBookingStatus().getStatusName().equals("CANCELLED")).count();

        // Group daily
        Map<String, Long> grouped = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getStartTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        Collectors.counting()
                ));

        List<BookingDetailDto> details = new ArrayList<>();
        List<String> allPeriods = generatePeriods("day", from, to);

        for (String period : allPeriods) {
            details.add(new BookingDetailDto(period, grouped.getOrDefault(period, 0L)));
        }

        details.sort(Comparator.comparing(BookingDetailDto::getPeriod));

        return new BookingReportDto(total, pending, confirmed, cancelled, details);
    }

    @Override
    public OccupancyReportDto getOccupancyReport(LocalDate from, LocalDate to) {
        List<Room> rooms = roomRepository.findAll();
        long totalRooms = rooms.size();

        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        // Total operational hours for a room in range
        long daysCount = ChronoUnit.DAYS.between(from, to) + 1;
        long totalOpHours = daysCount * DAILY_WORKING_HOURS;
        if (totalOpHours <= 0) totalOpHours = DAILY_WORKING_HOURS;

        // Get confirmed bookings in range
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingStatus().getStatusName().equals("CONFIRMED")
                        && !b.getStartTime().isBefore(start)
                        && b.getStartTime().isBefore(end))
                .collect(Collectors.toList());

        // Count rooms that have at least one booking
        Set<Integer> occupiedRoomIds = bookings.stream()
                .map(b -> b.getRoom().getRoomId())
                .collect(Collectors.toSet());
        long occupiedRoomsCount = occupiedRoomIds.size();

        BigDecimal systemOccupancyRate = totalRooms == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(occupiedRoomsCount)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalRooms), 2, RoundingMode.HALF_UP);

        // Map details
        List<RoomOccupancyDetailDto> roomDetails = new ArrayList<>();
        for (Room r : rooms) {
            List<Booking> roomBookings = bookings.stream()
                    .filter(b -> b.getRoom().getRoomId().equals(r.getRoomId()))
                    .collect(Collectors.toList());

            long bookedHours = roomBookings.stream()
                    .mapToLong(b -> {
                        Duration duration = Duration.between(b.getStartTime(), b.getEndTime());
                        return Math.max(1, duration.toHours());
                    })
                    .sum();

            BigDecimal occRate = BigDecimal.valueOf(bookedHours)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalOpHours), 1, RoundingMode.HALF_UP);
            if (occRate.compareTo(BigDecimal.valueOf(100)) > 0) {
                occRate = BigDecimal.valueOf(100);
            }

            // Realtime status
            String realtimeStatus = "AVAILABLE";
            String rts = roomService.getRealtimeStatus(r.getRoomId());
            if ("Đang bận".equalsIgnoreCase(rts)) realtimeStatus = "OCCUPIED";
            else if ("Bảo trì".equalsIgnoreCase(rts)) realtimeStatus = "MAINTENANCE";

            roomDetails.add(new RoomOccupancyDetailDto(
                    r.getRoomId(),
                    r.getName(),
                    r.getWorkspaceType() != null ? r.getWorkspaceType().getTypeName() : "N/A",
                    roomBookings.size(),
                    occRate,
                    realtimeStatus
            ));
        }

        // Sort descending by bookingCount
        roomDetails.sort((a, b) -> Long.compare(b.getBookingCount(), a.getBookingCount()));

        return new OccupancyReportDto(totalRooms, occupiedRoomsCount, systemOccupancyRate, roomDetails);
    }

    // Excel exports
    @Override
    public byte[] exportRevenueExcel(LocalDate from, LocalDate to) {
        RevenueReportDto report = getRevenueReport("day", from, to);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Doanh Thu");
            sheet.setDisplayGridlines(true);

            // Style Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO THỐNG KÊ DOANH THU");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setSize((short) 16);
            titleFont.setBold(true);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 2));

            // Summary Section
            Row sumRow1 = sheet.createRow(2);
            sumRow1.createCell(0).setCellValue("Từ ngày:");
            sumRow1.createCell(1).setCellValue(from.toString());
            sumRow1.createCell(2).setCellValue("Đến ngày:");
            sumRow1.createCell(3).setCellValue(to.toString());

            Row sumRow2 = sheet.createRow(3);
            sumRow2.createCell(0).setCellValue("Tổng số đơn:");
            sumRow2.createCell(1).setCellValue(report.getTotalBookings());
            sumRow2.createCell(2).setCellValue("Tổng doanh thu:");
            sumRow2.createCell(3).setCellValue(report.getTotalRevenue().doubleValue());

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.NAVY.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            Row headerRow = sheet.createRow(5);
            String[] headers = {"Thời gian", "Số lượng Booking", "Doanh thu (VND)"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle numStyle = workbook.createCellStyle();
            numStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
            numStyle.setBorderBottom(BorderStyle.THIN);
            numStyle.setBorderTop(BorderStyle.THIN);
            numStyle.setBorderLeft(BorderStyle.THIN);
            numStyle.setBorderRight(BorderStyle.THIN);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setBorderBottom(BorderStyle.THIN);
            textStyle.setBorderTop(BorderStyle.THIN);
            textStyle.setBorderLeft(BorderStyle.THIN);
            textStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 6;
            for (RevenueDetailDto detail : report.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue(detail.getPeriod()); c0.setCellStyle(textStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(detail.getBookingCount()); c1.setCellStyle(textStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(detail.getTotalRevenue().doubleValue()); c2.setCellStyle(numStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi export excel", e);
        }
    }

    @Override
    public byte[] exportBookingExcel(LocalDate from, LocalDate to) {
        BookingReportDto report = getBookingReport(from, to);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Đặt Phòng");
            sheet.setDisplayGridlines(true);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO THỐNG KÊ ĐẶT PHÒNG");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setSize((short) 16);
            titleFont.setBold(true);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 3));

            Row sumRow1 = sheet.createRow(2);
            sumRow1.createCell(0).setCellValue("Từ ngày:");
            sumRow1.createCell(1).setCellValue(from.toString());
            sumRow1.createCell(2).setCellValue("Đến ngày:");
            sumRow1.createCell(3).setCellValue(to.toString());

            Row sumRow2 = sheet.createRow(3);
            sumRow2.createCell(0).setCellValue("Tổng đơn:");
            sumRow2.createCell(1).setCellValue(report.getTotalBookings());
            sumRow2.createCell(2).setCellValue("Đang xử lý:");
            sumRow2.createCell(3).setCellValue(report.getPendingBookings());

            Row sumRow3 = sheet.createRow(4);
            sumRow3.createCell(0).setCellValue("Đã xác nhận:");
            sumRow3.createCell(1).setCellValue(report.getConfirmedBookings());
            sumRow3.createCell(2).setCellValue("Đã hủy:");
            sumRow3.createCell(3).setCellValue(report.getCancelledBookings());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.NAVY.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(6);
            String[] headers = {"Ngày", "Số lượng Đặt Phòng"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 7;
            for (BookingDetailDto detail : report.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue(detail.getPeriod()); c0.setCellStyle(borderStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(detail.getBookingCount()); c1.setCellStyle(borderStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public byte[] exportOccupancyExcel(LocalDate from, LocalDate to) {
        OccupancyReportDto report = getOccupancyReport(from, to);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Tỷ Lệ Lấp Đầy");
            sheet.setDisplayGridlines(true);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO TỶ LỆ LẤP ĐẦY PHÒNG");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setSize((short) 16);
            titleFont.setBold(true);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 5));

            Row sumRow1 = sheet.createRow(2);
            sumRow1.createCell(0).setCellValue("Từ ngày:");
            sumRow1.createCell(1).setCellValue(from.toString());
            sumRow1.createCell(2).setCellValue("Đến ngày:");
            sumRow1.createCell(3).setCellValue(to.toString());

            Row sumRow2 = sheet.createRow(3);
            sumRow2.createCell(0).setCellValue("Tổng số phòng:");
            sumRow2.createCell(1).setCellValue(report.getTotalRooms());
            sumRow2.createCell(2).setCellValue("Phòng được đặt trong kỳ:");
            sumRow2.createCell(3).setCellValue(report.getOccupiedRooms());

            Row sumRow3 = sheet.createRow(4);
            sumRow3.createCell(0).setCellValue("Tỷ lệ lấp đầy chung:");
            sumRow3.createCell(1).setCellValue(report.getOccupancyRate().doubleValue() + "%");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.NAVY.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(6);
            String[] headers = {"Mã phòng", "Tên phòng", "Loại phòng", "Số lần đặt", "Tỷ lệ lấp đầy (%)", "Trạng thái hiện tại"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 7;
            for (RoomOccupancyDetailDto detail : report.getRoomDetails()) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue("SP-" + String.format("%03d", detail.getRoomId())); c0.setCellStyle(borderStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(detail.getRoomName()); c1.setCellStyle(borderStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(detail.getRoomType()); c2.setCellStyle(borderStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(detail.getBookingCount()); c3.setCellStyle(borderStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(detail.getOccupancyRate().doubleValue()); c4.setCellStyle(borderStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(detail.getStatus()); c5.setCellStyle(borderStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // Helper methods
    private DateTimeFormatter getFormatter(String type) {
        if ("month".equalsIgnoreCase(type)) {
            return DateTimeFormatter.ofPattern("yyyy-MM");
        } else if ("year".equalsIgnoreCase(type)) {
            return DateTimeFormatter.ofPattern("yyyy");
        }
        return DateTimeFormatter.ofPattern("yyyy-MM-dd");
    }

    private List<String> generatePeriods(String type, LocalDate from, LocalDate to) {
        List<String> list = new ArrayList<>();
        LocalDate curr = from;

        if ("month".equalsIgnoreCase(type)) {
            LocalDate temp = from.withDayOfMonth(1);
            LocalDate limit = to.withDayOfMonth(1);
            while (!temp.isAfter(limit)) {
                list.add(temp.format(DateTimeFormatter.ofPattern("yyyy-MM")));
                temp = temp.plusMonths(1);
            }
        } else if ("year".equalsIgnoreCase(type)) {
            LocalDate temp = from.withDayOfYear(1);
            LocalDate limit = to.withDayOfYear(1);
            while (!temp.isAfter(limit)) {
                list.add(temp.format(DateTimeFormatter.ofPattern("yyyy")));
                temp = temp.plusYears(1);
            }
        } else {
            while (!curr.isAfter(to)) {
                list.add(curr.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                curr = curr.plusDays(1);
            }
        }
        return list;
    }
}
