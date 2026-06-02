import React, { useState } from "react";
import { downloadBlob } from "../api/reportApi";

const ExcelIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9.5 17l-2-3.5H9l1.25 2.25L11.5 13.5h1.5l-2 3.5 2 3.5H11.5L10.25 18.25 9 20.5H7.5l2-3.5z"/>
    </svg>
);

/**
 * ExportButton — nút xuất Excel dùng chung.
 *
 * Props:
 *   exportFn   {async fn}   hàm gọi API trả về blob response
 *   filename   {string}     tên file mặc định
 *   label      {string}     nhãn nút
 */
export default function ExportButton({
                                         exportFn,
                                         filename = "export.xlsx",
                                         label = "Xuất Excel",
                                     }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            const response = await exportFn();
            downloadBlob(response, filename);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Xuất Excel thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button className="btn-export" onClick={handleExport} disabled={loading}>
            <ExcelIcon />
            {loading ? "Đang xuất..." : label}
        </button>
    );
}