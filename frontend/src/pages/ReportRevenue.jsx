import React, { useState, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import {
    getRevenueByDay, getRevenueByMonth, getRevenueByYear,
    exportRevenueExcel, downloadBlob,
} from "../api/reportApi";
import SummaryCard      from "../components/SummaryCard";
import ReportDateFilter from "../components/ReportDateFilter";
import ExportButton     from "../components/ExportButton";

// ─────────────────────────────────────────────
//  Defaults
// ─────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};

const VIEW_OPTIONS = [
    { value: "day",   label: "Theo ngày"  },
    { value: "month", label: "Theo tháng" },
    { value: "year",  label: "Theo năm"   },
];

const formatVND = (v) => {
    if (!v) return "0 đ";
    return Number(v).toLocaleString("vi-VN") + " đ";
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#1a2e44" }}>{label}</div>
            <div style={{ color: "#2563eb" }}>Doanh thu: {Number(payload[0]?.value || 0).toLocaleString("vi-VN")} đ</div>
            {payload[1] && <div style={{ color: "#16a34a" }}>Số đơn: {payload[1].value}</div>}
        </div>
    );
};

// ─────────────────────────────────────────────
//  Pagination hook
// ─────────────────────────────────────────────
function usePagination(data, pageSize = 10) {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);
    const paged = data.slice((page - 1) * pageSize, page * pageSize);
    return { paged, page, setPage, totalPages };
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────
export default function ReportRevenue() {
    const [view,      setView]      = useState("day");
    const [fromDate,  setFromDate]  = useState(firstOfMonth());
    const [toDate,    setToDate]    = useState(todayStr());
    const [summary,   setSummary]   = useState(null);
    const [loading,   setLoading]   = useState(false);

    const { paged, page, setPage, totalPages } = usePagination(summary?.details || []);

    const load = useCallback(async (v = view, from = fromDate, to = toDate) => {
        setLoading(true);
        setPage(1);
        try {
            const fnMap = { day: getRevenueByDay, month: getRevenueByMonth, year: getRevenueByYear };
            const res = await fnMap[v](from, to);
            setSummary(res.data?.data || null);
        } catch (err) {
            console.error("Revenue load error:", err);
        } finally {
            setLoading(false);
        }
    }, [view, fromDate, toDate, setPage]);

    useEffect(() => { load(); }, []); // initial load

    const handleViewChange = (v) => {
        setView(v);
        load(v, fromDate, toDate);
    };

    const handleApply = () => load(view, fromDate, toDate);

    const exportFn = () => exportRevenueExcel(fromDate, toDate);

    const now = new Date();
    const updatedAt = `Cập nhật lúc: ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} ${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()}`;

    return (
        <>
            {/* Controls */}
            <ReportDateFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromChange={setFromDate}
                onToChange={setToDate}
                onApply={handleApply}
                loading={loading}
            >
                <select
                    className="report-select"
                    value={view}
                    onChange={(e) => handleViewChange(e.target.value)}
                >
                    {VIEW_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <ExportButton exportFn={exportFn} filename="BaoCaoDoanhThu.xlsx" label="Xuất Excel" />
            </ReportDateFilter>

            {/* Summary cards */}
            <div className="report-summary-cards">
                <SummaryCard
                    label="Tổng doanh thu"
                    value={summary ? formatVND(summary.totalRevenue) : "—"}
                    icon="💰"
                    color="blue"
                />
                <SummaryCard
                    label="Doanh thu phòng"
                    value={summary ? formatVND(summary.totalRevenue) : "—"}
                    icon="🏢"
                    color="green"
                />
                <SummaryCard
                    label="Dịch vụ khác"
                    value="0 đ"
                    icon="🧳"
                    color="orange"
                />
                <SummaryCard
                    label="Số đơn"
                    value={summary?.totalBookings ?? "—"}
                    icon="👥"
                    color="purple"
                />
            </div>

            {/* Chart */}
            <div className="report-chart-card">
                <div className="report-chart-title">
                    Chi tiết doanh thu
                    <span className="report-chart-subtitle">
            {VIEW_OPTIONS.find(o => o.value === view)?.label}
          </span>
                </div>

                {loading ? (
                    <div className="report-loading"><div className="report-spinner" /></div>
                ) : !summary?.details?.length ? (
                    <div className="report-empty">Không có dữ liệu trong khoảng thời gian này.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={summary.details}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="period"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) =>
                                    v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + "M" : v
                                }
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="totalRevenue" name="Doanh thu" fill="#2563eb" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Detail table */}
            <div className="report-table-card">
                <div className="report-table-header">
                    <span className="report-table-title">Chi tiết doanh thu</span>
                    <span className="report-table-updated">{updatedAt}</span>
                </div>

                <div className="report-table-wrap">
                    <table className="report-table">
                        <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Số đơn</th>
                            <th>Doanh thu phòng (đ)</th>
                            <th>Dịch vụ khác (đ)</th>
                            <th>Tổng doanh thu (đ)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={5}><div className="report-loading"><div className="report-spinner" /></div></td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan={5} className="report-empty">Không có dữ liệu</td></tr>
                        ) : (
                            <>
                                {paged.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.period}</td>
                                        <td>{row.bookingCount}</td>
                                        <td>{Number(row.totalRevenue).toLocaleString("vi-VN")}</td>
                                        <td>0</td>
                                        <td><strong>{Number(row.totalRevenue).toLocaleString("vi-VN")}</strong></td>
                                    </tr>
                                ))}
                            </>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="report-pagination">
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                className={`page-btn ${page === p ? "active" : ""}`}
                                onClick={() => setPage(p)}
                            >{p}</button>
                        ))}
                        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                )}
            </div>
        </>
    );
}