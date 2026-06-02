import React, { useState, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import {
    getOccupancyReport,
    exportOccupancyExcel,
} from "../api/reportApi";
import SummaryCard      from "../components/SummaryCard.jsx";
import ReportDateFilter from "../components/ReportDateFilter";
import ExportButton     from "../components/ExportButton";

const todayStr     = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};

const STATUS_LABEL = {
    AVAILABLE:   { label: "Trống",       cls: "available"    },
    OCCUPIED:    { label: "Đang sử dụng",cls: "occupied"     },
    MAINTENANCE: { label: "Bảo trì",     cls: "maintenance"  },
    INACTIVE:    { label: "Ngừng hoạt động", cls: "unavailable" },
};

const getStatusInfo = (s) =>
    STATUS_LABEL[s?.toUpperCase()] || { label: s, cls: "available" };

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a2e44" }}>{label}</div>
            <div style={{ color: "#2563eb" }}>Số lần đặt: {payload[0].value}</div>
        </div>
    );
};

function usePagination(data, pageSize = 10) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const paged = data.slice((page - 1) * pageSize, page * pageSize);
    return { paged, page, setPage, totalPages };
}

export default function ReportOccupancy() {
    const [fromDate, setFromDate] = useState(firstOfMonth());
    const [toDate,   setToDate]   = useState(todayStr());
    const [report,   setReport]   = useState(null);
    const [search,   setSearch]   = useState("");
    const [loading,  setLoading]  = useState(false);

    const filtered = (report?.roomDetails || []).filter(r =>
        r.roomName?.toLowerCase().includes(search.toLowerCase()) ||
        r.roomType?.toLowerCase().includes(search.toLowerCase())
    );

    const { paged, page, setPage, totalPages } = usePagination(filtered);

    const load = useCallback(async (from = fromDate, to = toDate) => {
        setLoading(true);
        setPage(1);
        try {
            const res = await getOccupancyReport(from, to);
            setReport(res.data?.data || null);
        } catch (err) {
            console.error("Occupancy load error:", err);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, setPage]);

    useEffect(() => { load(); }, []);

    const handleApply = () => load(fromDate, toDate);

    // Top 10 rooms for bar chart
    const chartData = (report?.roomDetails || [])
        .slice()
        .sort((a, b) => Number(b.bookingCount) - Number(a.bookingCount))
        .slice(0, 10)
        .map(r => ({ name: r.roomName, bookingCount: Number(r.bookingCount) }));

    const BAR_COLORS = [
        "#2563eb","#3b82f6","#60a5fa","#93c5fd","#bfdbfe",
        "#dbeafe","#eff6ff","#1d4ed8","#1e40af","#1e3a8a",
    ];

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
                <select className="report-select" defaultValue="occupancy">
                    <option value="occupancy">Không gian</option>
                </select>
                <ExportButton
                    exportFn={() => exportOccupancyExcel(fromDate, toDate)}
                    filename="BaoCaoLapDay.xlsx"
                    label="Xuất Excel"
                />
            </ReportDateFilter>

            {/* Summary cards */}
            <div className="report-summary-cards">
                <SummaryCard
                    label="Tổng số phòng"
                    value={report?.totalRooms ?? "—"}
                    icon="🏢"
                    color="blue"
                />
                <SummaryCard
                    label="Phòng đã thuê"
                    value={report?.occupiedRooms ?? "—"}
                    icon="✅"
                    color="green"
                />
                <SummaryCard
                    label="Tỷ lệ lấp đầy"
                    value={report ? `${report.occupancyRate}%` : "—"}
                    icon="📊"
                    color="orange"
                />
                <SummaryCard
                    label="Phòng chưa thuê"
                    value={report ? report.totalRooms - report.occupiedRooms : "—"}
                    icon="🔓"
                    color="purple"
                />
            </div>

            {/* Bar chart top rooms */}
            {chartData.length > 0 && (
                <div className="report-chart-card">
                    <div className="report-chart-title">
                        Top phòng được đặt nhiều nhất
                        <span className="report-chart-subtitle">Số lần đặt trong kỳ</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 16, left: -8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                                tickLine={false} axisLine={false}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                                height={48}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                                tickLine={false} axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="bookingCount" name="Số lần đặt" radius={[4,4,0,0]}>
                                {chartData.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Table */}
            <div className="report-table-card">
                <div className="report-table-header">
                    <span className="report-table-title">Danh sách không gian</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ position: "relative" }}>
              <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 14, color: "#9ca3af",
              }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                style={{
                                    paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                                    border: "1px solid #d1d9e0", borderRadius: 8, fontSize: 13,
                                    outline: "none", width: 200,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="report-table-wrap">
                    <table className="report-table">
                        <thead>
                        <tr>
                            <th>MÃ</th>
                            <th>TÊN KHÔNG GIAN</th>
                            <th>LOẠI KHÔNG GIAN</th>
                            <th>SỐ LẦN ĐẶT</th>
                            <th>TỶ LỆ LẤP ĐẦY</th>
                            <th>TRẠNG THÁI</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={6}><div className="report-loading"><div className="report-spinner" /></div></td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan={6} className="report-empty">Không có dữ liệu</td></tr>
                        ) : (
                            paged.map((room, i) => {
                                const si = getStatusInfo(room.status);
                                return (
                                    <tr key={i}>
                                        <td>
                        <span style={{ color: "#2563eb", fontWeight: 600 }}>
                          SP-{String(room.roomId).padStart(3, "0")}
                        </span>
                                        </td>
                                        <td style={{ textAlign: "left", fontWeight: 500 }}>{room.roomName}</td>
                                        <td>{room.roomType}</td>
                                        <td>{room.bookingCount}</td>
                                        <td>
                                            <div className="occ-rate-bar-wrap">
                                                <div className="occ-rate-bar">
                                                    <div
                                                        className="occ-rate-bar-fill"
                                                        style={{ width: `${Math.min(Number(room.occupancyRate), 100)}%` }}
                                                    />
                                                </div>
                                                <span className="occ-rate-text">{room.occupancyRate}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${si.cls}`}>{si.label}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="report-pagination">
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                            <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                        <select className="page-size-select" defaultValue={10}>
                            <option value={10}>10/trang</option>
                            <option value={20}>20/trang</option>
                            <option value={50}>50/trang</option>
                        </select>
                    </div>
                )}
            </div>
        </>
    );
}