package com.smartoffice.backend.services;

import com.smartoffice.backend.dto.report.BookingReportDto;
import com.smartoffice.backend.dto.report.OccupancyReportDto;
import com.smartoffice.backend.dto.report.RevenueReportDto;
import java.time.LocalDate;

public interface ReportService {
    RevenueReportDto getRevenueReport(String type, LocalDate from, LocalDate to);
    BookingReportDto getBookingReport(LocalDate from, LocalDate to);
    OccupancyReportDto getOccupancyReport(LocalDate from, LocalDate to);
    byte[] exportRevenueExcel(LocalDate from, LocalDate to);
    byte[] exportBookingExcel(LocalDate from, LocalDate to);
    byte[] exportOccupancyExcel(LocalDate from, LocalDate to);
}
