import React from "react";

/**
 * ReportDateFilter — thanh filter ngày tháng dùng chung cho các trang report.
 *
 * Props:
 *   fromDate      {string}   "YYYY-MM-DD"
 *   toDate        {string}   "YYYY-MM-DD"
 *   onFromChange  {fn}
 *   onToChange    {fn}
 *   onApply       {fn}
 *   loading       {bool}
 *   children      — slot cho các control bổ sung (select, export btn...)
 */
export default function ReportDateFilter({
                                             fromDate,
                                             toDate,
                                             onFromChange,
                                             onToChange,
                                             onApply,
                                             loading = false,
                                             children,
                                         }) {
    return (
        <div className="report-controls">
            {children}
            <div className="report-date-group">
                <span className="report-date-label">TỪ NGÀY</span>
                <input
                    type="date"
                    className="report-date-input"
                    value={fromDate}
                    onChange={(e) => onFromChange(e.target.value)}
                />
                <span className="report-date-label">ĐẾN NGÀY</span>
                <input
                    type="date"
                    className="report-date-input"
                    value={toDate}
                    onChange={(e) => onToChange(e.target.value)}
                />
                <button className="btn-apply" onClick={onApply} disabled={loading}>
                    {loading ? "Đang tải..." : "Áp dụng"}
                </button>
            </div>
        </div>
    );
}