package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.report.BookingReportDTO;
import com.smartoffice.backend.dto.report.BookingStatDTO;
import com.smartoffice.backend.dto.report.OccupancyReportDTO;
import com.smartoffice.backend.dto.report.RevenueSummaryDTO;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {

    // ── Revenue ──────────────────────────────────
    RevenueSummaryDTO getRevenueByDay(LocalDateTime fromDate, LocalDateTime toDate);

    RevenueSummaryDTO getRevenueByMonth(LocalDateTime fromDate, LocalDateTime toDate);

    RevenueSummaryDTO getRevenueByYear(LocalDateTime fromDate, LocalDateTime toDate);

    // ── Booking ───────────────────────────────────
    BookingReportDTO getBookingSummary(LocalDateTime fromDate, LocalDateTime toDate);

    List<BookingStatDTO> getBookingStatsByDay(LocalDateTime fromDate, LocalDateTime toDate);

    // ── Occupancy ────────────────────────────────
    OccupancyReportDTO getOccupancyReport(LocalDateTime fromDate, LocalDateTime toDate);

    // ── Export Excel ─────────────────────────────
    void exportRevenueExcel(LocalDateTime fromDate, LocalDateTime toDate,
                            HttpServletResponse response) throws IOException;

    void exportBookingExcel(LocalDateTime fromDate, LocalDateTime toDate,
                            HttpServletResponse response) throws IOException;

    void exportOccupancyExcel(LocalDateTime fromDate, LocalDateTime toDate,
                              HttpServletResponse response) throws IOException;
}