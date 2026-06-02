package com.smartoffice.backend.services.impl;

import com.smartoffice.backend.dto.report.*;
import com.smartoffice.backend.repositories.ReportReponsitory;
import com.smartoffice.backend.repositories.ReportReponsitory;
import com.smartoffice.backend.services.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportReponsitory reportRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ═══════════════════════════════════════════════════════
    //  REVENUE
    // ═══════════════════════════════════════════════════════

    @Override
    public RevenueSummaryDTO getRevenueByDay(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = reportRepository.revenueByDay(fromDate, toDate);
        return buildRevenueSummary(rows);
    }

    @Override
    public RevenueSummaryDTO getRevenueByMonth(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = reportRepository.revenueByMonth(fromDate, toDate);
        return buildRevenueSummary(rows);
    }

    @Override
    public RevenueSummaryDTO getRevenueByYear(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = reportRepository.revenueByYear(fromDate, toDate);
        return buildRevenueSummary(rows);
    }

    private RevenueSummaryDTO buildRevenueSummary(List<Object[]> rows) {
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalBookings = 0L;
        List<RevenueReportDTO> details = new ArrayList<>();

        for (Object[] row : rows) {
            String period     = row[0] != null ? row[0].toString() : "";
            BigDecimal rev    = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long count        = row[2] != null ? Long.parseLong(row[2].toString()) : 0L;

            details.add(new RevenueReportDTO(period, rev, count));
            totalRevenue = totalRevenue.add(rev);
            totalBookings += count;
        }

        return new RevenueSummaryDTO(totalRevenue, totalBookings, details);
    }

    // ═══════════════════════════════════════════════════════
    //  BOOKING
    // ═══════════════════════════════════════════════════════

    @Override
    public BookingReportDTO getBookingSummary(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = reportRepository.bookingStatsByStatus(fromDate, toDate);

        long total = 0, pending = 0, confirmed = 0, cancelled = 0, completed = 0;

        for (Object[] row : rows) {
            String status = row[0] != null ? row[0].toString().toUpperCase() : "";
            long   cnt    = row[1] != null ? Long.parseLong(row[1].toString()) : 0L;
            total += cnt;
            switch (status) {
                case "PENDING"   -> pending   += cnt;
                case "CONFIRMED" -> confirmed += cnt;
                case "CANCELLED" -> cancelled += cnt;
                case "COMPLETED" -> completed += cnt;
            }
        }

        return new BookingReportDTO(total, pending, confirmed, cancelled, completed);
    }

    @Override
    public List<BookingStatDTO> getBookingStatsByDay(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = reportRepository.bookingStatsByDay(fromDate, toDate);
        List<BookingStatDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            String period    = row[0] != null ? row[0].toString() : "";
            long   total     = row[1] != null ? Long.parseLong(row[1].toString()) : 0L;
            long   confirmed = row[2] != null ? Long.parseLong(row[2].toString()) : 0L;
            long   cancelled = row[3] != null ? Long.parseLong(row[3].toString()) : 0L;
            long   pending   = row[4] != null ? Long.parseLong(row[4].toString()) : 0L;
            result.add(new BookingStatDTO(period, total, confirmed, cancelled, pending));
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════
    //  OCCUPANCY
    // ═══════════════════════════════════════════════════════

    @Override
    public OccupancyReportDTO getOccupancyReport(LocalDateTime fromDate, LocalDateTime toDate) {
        Long totalRooms = reportRepository.countTotalRooms();
        List<Object[]> rows = reportRepository.occupancyByRoom(fromDate, toDate);

        List<RoomOccupancyDTO> roomDetails = new ArrayList<>();
        int occupiedCount = 0;

        // Tính số ngày trong khoảng (để tính occupancy rate mỗi phòng)
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate);
        if (totalDays == 0) totalDays = 1;

        for (Object[] row : rows) {
            Integer roomId      = row[0] != null ? Integer.parseInt(row[0].toString()) : 0;
            String  roomName    = row[1] != null ? row[1].toString() : "";
            String  roomType    = row[2] != null ? row[2].toString() : "";
            String  roomStatus  = row[3] != null ? row[3].toString() : "";
            long    bookCount   = row[4] != null ? Long.parseLong(row[4].toString()) : 0L;

            // Occupancy rate của từng phòng = bookingCount / totalDays * 100
            BigDecimal rate = BigDecimal.valueOf(bookCount)
                    .divide(BigDecimal.valueOf(totalDays), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .min(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);

            if (bookCount > 0) occupiedCount++;

            roomDetails.add(new RoomOccupancyDTO(roomId, roomName, roomType, bookCount, rate, roomStatus));
        }

        long total = totalRooms != null ? totalRooms : 0L;
        BigDecimal overallRate = total > 0
                ? BigDecimal.valueOf(occupiedCount)
                .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new OccupancyReportDTO((int) total, occupiedCount, overallRate, roomDetails);
    }

    // ═══════════════════════════════════════════════════════
    //  EXPORT EXCEL — helpers
    // ═══════════════════════════════════════════════════════

    /** Tạo CellStyle cho tiêu đề (header) */
    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    /** Tạo CellStyle cho title report */
    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    /** Tạo CellStyle cho data row thường */
    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    /** Tạo CellStyle cho data row số tiền */
    private CellStyle createMoneyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat df = wb.createDataFormat();
        style.setDataFormat(df.getFormat("#,##0"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    /** Tạo CellStyle cho total row */
    private CellStyle createTotalStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        DataFormat df = wb.createDataFormat();
        style.setDataFormat(df.getFormat("#,##0"));
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private void autoSizeColumns(Sheet sheet, int numCols) {
        for (int i = 0; i < numCols; i++) {
            sheet.autoSizeColumn(i);
            // add a bit of padding
            sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1024);
        }
    }

    private void setResponseHeaders(HttpServletResponse response, String filename) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + filename + "\"");
        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    }

    // ─────────────────────────────────────────────
    // Export Revenue
    // ─────────────────────────────────────────────
    @Override
    public void exportRevenueExcel(LocalDateTime fromDate, LocalDateTime toDate,
                                   HttpServletResponse response) throws IOException {
        RevenueSummaryDTO summary = getRevenueByDay(fromDate, toDate);
        String filename = "BaoCaoDoanhThu_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".xlsx";
        setResponseHeaders(response, filename);

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Doanh Thu");
            sheet.setDefaultRowHeightInPoints(18);

            CellStyle titleStyle  = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle   = createDataStyle(wb);
            CellStyle moneyStyle  = createMoneyStyle(wb);
            CellStyle totalStyle  = createTotalStyle(wb);

            int rowIdx = 0;

            // ── Title ──
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(28);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO DOANH THU - SMART OFFICE SPACE");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));

            // ── Sub title (date range) ──
            Row subRow = sheet.createRow(rowIdx++);
            Cell subCell = subRow.createCell(0);
            subCell.setCellValue("Từ ngày: " + fromDate.format(DATE_FMT)
                    + "  →  Đến ngày: " + toDate.format(DATE_FMT));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 3));

            rowIdx++; // blank row

            // ── Summary cards ──
            Row s1 = sheet.createRow(rowIdx++);
            s1.createCell(0).setCellValue("Tổng doanh thu (VNĐ):");
            s1.createCell(1).setCellValue(summary.getTotalRevenue().doubleValue());
            s1.getCell(1).setCellStyle(moneyStyle);

            Row s2 = sheet.createRow(rowIdx++);
            s2.createCell(0).setCellValue("Tổng số đơn đặt phòng:");
            s2.createCell(1).setCellValue(summary.getTotalBookings());

            rowIdx++; // blank row

            // ── Header ──
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(22);
            String[] headers = {"Ngày", "Số đơn", "Doanh thu phòng (VNĐ)", "Tổng doanh thu (VNĐ)"};
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // ── Data rows ──
            for (RevenueReportDTO dto : summary.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue(dto.getPeriod());          c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(dto.getBookingCount());    c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(0);                        c2.setCellStyle(moneyStyle); // room revenue placeholder
                Cell c3 = row.createCell(3); c3.setCellValue(dto.getTotalRevenue().doubleValue()); c3.setCellStyle(moneyStyle);
            }

            // ── Total row ──
            Row totalRow = sheet.createRow(rowIdx);
            totalRow.setHeightInPoints(20);
            Cell tc0 = totalRow.createCell(0); tc0.setCellValue("TỔNG CỘNG");
            CellStyle tLabelStyle = wb.createCellStyle();
            Font tf = wb.createFont(); tf.setBold(true); tLabelStyle.setFont(tf);
            tLabelStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            tLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tLabelStyle.setBorderBottom(BorderStyle.MEDIUM);
            tLabelStyle.setBorderTop(BorderStyle.THIN);
            tLabelStyle.setBorderLeft(BorderStyle.THIN);
            tLabelStyle.setBorderRight(BorderStyle.THIN);
            tc0.setCellStyle(tLabelStyle);

            Cell tc1 = totalRow.createCell(1); tc1.setCellValue(summary.getTotalBookings()); tc1.setCellStyle(totalStyle);
            Cell tc2 = totalRow.createCell(2); tc2.setCellValue(0);                          tc2.setCellStyle(totalStyle);
            Cell tc3 = totalRow.createCell(3); tc3.setCellValue(summary.getTotalRevenue().doubleValue()); tc3.setCellStyle(totalStyle);

            autoSizeColumns(sheet, 4);
            wb.write(response.getOutputStream());
        }
    }

    // ─────────────────────────────────────────────
    // Export Booking
    // ─────────────────────────────────────────────
    @Override
    public void exportBookingExcel(LocalDateTime fromDate, LocalDateTime toDate,
                                   HttpServletResponse response) throws IOException {
        BookingReportDTO summary = getBookingSummary(fromDate, toDate);
        List<BookingStatDTO> details = getBookingStatsByDay(fromDate, toDate);

        String filename = "BaoCaoDatPhong_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".xlsx";
        setResponseHeaders(response, filename);

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Đặt Phòng");
            sheet.setDefaultRowHeightInPoints(18);

            CellStyle titleStyle  = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle   = createDataStyle(wb);
            CellStyle totalStyle  = createTotalStyle(wb);

            int rowIdx = 0;

            // Title
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(28);
            Cell tc = titleRow.createCell(0);
            tc.setCellValue("BÁO CÁO ĐẶT PHÒNG - SMART OFFICE SPACE");
            tc.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            Row subRow = sheet.createRow(rowIdx++);
            Cell sc = subRow.createCell(0);
            sc.setCellValue("Từ ngày: " + fromDate.format(DATE_FMT) + "  →  Đến ngày: " + toDate.format(DATE_FMT));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 4));

            rowIdx++; // blank

            // Summary
            String[] sumLabels = {"Tổng đơn", "Chờ xử lý", "Đã xác nhận", "Đã hủy", "Hoàn thành"};
            long[]   sumVals   = {summary.getTotalBookings(), summary.getPendingBookings(),
                    summary.getConfirmedBookings(), summary.getCancelledBookings(),
                    summary.getCompletedBookings()};
            Row sumRow = sheet.createRow(rowIdx++);
            for (int i = 0; i < sumLabels.length; i++) {
                sumRow.createCell(i).setCellValue(sumLabels[i] + ": " + sumVals[i]);
            }

            rowIdx++; // blank

            // Header
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(22);
            String[] headers = {"Ngày", "Tổng đơn", "Đã xác nhận", "Đã hủy", "Chờ xử lý"};
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Data
            for (BookingStatDTO dto : details) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue(dto.getPeriod());             c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(dto.getTotalBookings());      c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(dto.getConfirmedBookings());  c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(dto.getCancelledBookings());  c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(dto.getPendingBookings());    c4.setCellStyle(dataStyle);
            }

            // Total
            Row totalRow = sheet.createRow(rowIdx);
            totalRow.createCell(0).setCellValue("TỔNG CỘNG");
            Cell tv1 = totalRow.createCell(1); tv1.setCellValue(summary.getTotalBookings());     tv1.setCellStyle(totalStyle);
            Cell tv2 = totalRow.createCell(2); tv2.setCellValue(summary.getConfirmedBookings()); tv2.setCellStyle(totalStyle);
            Cell tv3 = totalRow.createCell(3); tv3.setCellValue(summary.getCancelledBookings()); tv3.setCellStyle(totalStyle);
            Cell tv4 = totalRow.createCell(4); tv4.setCellValue(summary.getPendingBookings());   tv4.setCellStyle(totalStyle);

            autoSizeColumns(sheet, 5);
            wb.write(response.getOutputStream());
        }
    }

    // ─────────────────────────────────────────────
    // Export Occupancy
    // ─────────────────────────────────────────────
    @Override
    public void exportOccupancyExcel(LocalDateTime fromDate, LocalDateTime toDate,
                                     HttpServletResponse response) throws IOException {
        OccupancyReportDTO report = getOccupancyReport(fromDate, toDate);

        String filename = "BaoCaoLapDay_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".xlsx";
        setResponseHeaders(response, filename);

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Tỷ Lệ Lấp Đầy");
            sheet.setDefaultRowHeightInPoints(18);

            CellStyle titleStyle  = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle   = createDataStyle(wb);
            CellStyle moneyStyle  = createMoneyStyle(wb);

            int rowIdx = 0;

            // Title
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(28);
            Cell tc = titleRow.createCell(0);
            tc.setCellValue("BÁO CÁO TỶ LỆ LẤP ĐẦY PHÒNG - SMART OFFICE SPACE");
            tc.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            Row subRow = sheet.createRow(rowIdx++);
            subRow.createCell(0).setCellValue("Từ ngày: " + fromDate.format(DATE_FMT)
                    + "  →  Đến ngày: " + toDate.format(DATE_FMT));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 5));

            rowIdx++;

            // Summary
            Row s1 = sheet.createRow(rowIdx++);
            s1.createCell(0).setCellValue("Tổng số phòng: " + report.getTotalRooms());
            s1.createCell(2).setCellValue("Phòng đã thuê: " + report.getOccupiedRooms());
            s1.createCell(4).setCellValue("Tỷ lệ lấp đầy: " + report.getOccupancyRate() + "%");

            rowIdx++;

            // Header
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(22);
            String[] headers = {"Mã phòng", "Tên phòng", "Loại phòng", "Số lần đặt", "Tỷ lệ lấp đầy (%)", "Trạng thái"};
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Data
            for (RoomOccupancyDTO dto : report.getRoomDetails()) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0); c0.setCellValue("SP-" + String.format("%03d", dto.getRoomId())); c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(dto.getRoomName());         c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(dto.getRoomType());         c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(dto.getBookingCount());     c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(dto.getOccupancyRate().doubleValue()); c4.setCellStyle(moneyStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(dto.getStatus());           c5.setCellStyle(dataStyle);
            }

            autoSizeColumns(sheet, 6);
            wb.write(response.getOutputStream());
        }
    }
}