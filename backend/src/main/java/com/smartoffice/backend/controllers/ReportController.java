package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.report.BookingReportDTO;
import com.smartoffice.backend.dto.report.BookingStatDTO;
import com.smartoffice.backend.dto.report.OccupancyReportDTO;
import com.smartoffice.backend.dto.report.RevenueSummaryDTO;
import com.smartoffice.backend.services.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * ReportController — Tất cả endpoint chỉ dành cho ADMIN.
 * Base path: /api/reports
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    // ═══════════════════════════════════════════════════════
    //  Helper: parse date params → LocalDateTime
    // ═══════════════════════════════════════════════════════

    private LocalDateTime startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : LocalDateTime.now().minusMonths(1);
    }

    private LocalDateTime endOfDay(LocalDate date) {
        return date != null ? date.atTime(LocalTime.MAX) : LocalDateTime.now();
    }

    // ═══════════════════════════════════════════════════════
    //  REVENUE ENDPOINTS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/reports/revenue/day?fromDate=2026-01-01&toDate=2026-12-31
     * Doanh thu theo ngày trong khoảng thời gian.
     */
    @GetMapping("/revenue/day")
    public ResponseEntity<ApiResponse<RevenueSummaryDTO>> revenueByDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        RevenueSummaryDTO data = reportService.getRevenueByDay(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/reports/revenue/month?fromDate=2026-01-01&toDate=2026-12-31
     * Doanh thu theo tháng.
     */
    @GetMapping("/revenue/month")
    public ResponseEntity<ApiResponse<RevenueSummaryDTO>> revenueByMonth(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        RevenueSummaryDTO data = reportService.getRevenueByMonth(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/reports/revenue/year?fromDate=2020-01-01&toDate=2026-12-31
     * Doanh thu theo năm.
     */
    @GetMapping("/revenue/year")
    public ResponseEntity<ApiResponse<RevenueSummaryDTO>> revenueByYear(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        RevenueSummaryDTO data = reportService.getRevenueByYear(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ═══════════════════════════════════════════════════════
    //  BOOKING ENDPOINTS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/reports/bookings/summary?fromDate=2026-01-01&toDate=2026-12-31
     * Tổng hợp booking theo trạng thái.
     */
    @GetMapping("/bookings/summary")
    public ResponseEntity<ApiResponse<BookingReportDTO>> bookingSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        BookingReportDTO data = reportService.getBookingSummary(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/reports/bookings/daily?fromDate=2026-01-01&toDate=2026-12-31
     * Chi tiết booking theo từng ngày.
     */
    @GetMapping("/bookings/daily")
    public ResponseEntity<ApiResponse<List<BookingStatDTO>>> bookingByDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        List<BookingStatDTO> data = reportService.getBookingStatsByDay(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ═══════════════════════════════════════════════════════
    //  OCCUPANCY ENDPOINTS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/reports/occupancy?fromDate=2026-01-01&toDate=2026-12-31
     * Báo cáo tỷ lệ lấp đầy phòng.
     */
    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<OccupancyReportDTO>> occupancyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        OccupancyReportDTO data = reportService.getOccupancyReport(startOfDay(fromDate), endOfDay(toDate));
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ═══════════════════════════════════════════════════════
    //  EXPORT EXCEL ENDPOINTS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/reports/export/revenue?fromDate=2026-01-01&toDate=2026-12-31
     * Xuất file Excel báo cáo doanh thu.
     */
    @GetMapping("/export/revenue")
    public void exportRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            HttpServletResponse response) throws IOException {

        reportService.exportRevenueExcel(startOfDay(fromDate), endOfDay(toDate), response);
    }

    /**
     * GET /api/reports/export/bookings?fromDate=2026-01-01&toDate=2026-12-31
     * Xuất file Excel báo cáo đặt phòng.
     */
    @GetMapping("/export/bookings")
    public void exportBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            HttpServletResponse response) throws IOException {

        reportService.exportBookingExcel(startOfDay(fromDate), endOfDay(toDate), response);
    }

    /**
     * GET /api/reports/export/occupancy?fromDate=2026-01-01&toDate=2026-12-31
     * Xuất file Excel báo cáo tỷ lệ lấp đầy.
     */
    @GetMapping("/export/occupancy")
    public void exportOccupancy(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            HttpServletResponse response) throws IOException {

        reportService.exportOccupancyExcel(startOfDay(fromDate), endOfDay(toDate), response);
    }
}