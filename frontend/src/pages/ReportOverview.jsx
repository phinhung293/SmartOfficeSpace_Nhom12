import React, { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    getRevenueByDay,
    getRevenueByMonth,
    getRevenueByYear,
} from "../api/reportApi";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const monthsAgo = (n) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d.toISOString().split("T")[0];
};
const yearsAgo = (n) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString().split("T")[0];
};

const formatVND = (v) => {
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "T";
    if (v >= 1_000_000)     return (v / 1_000_000).toFixed(0) + "M";
    if (v >= 1_000)         return (v / 1_000).toFixed(0) + "K";
    return v;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a2e44" }}>{label}</div>
            <div style={{ color: "#2563eb" }}>
                Doanh thu: {Number(payload[0].value).toLocaleString("vi-VN")} đ
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Mini chart card
// ─────────────────────────────────────────────
function MiniChartCard({ title, badge, badgeClass, data, loading }) {
    return (
        <div className="overview-chart-card">
            <div className="overview-chart-header">
                <span className="overview-chart-title">{title}</span>
                {badge && (
                    <span className={`overview-chart-badge ${badgeClass}`}>{badge}</span>
                )}
            </div>
            {loading ? (
                <div className="report-loading" style={{ padding: 20 }}>
                    <div className="report-spinner" />
                </div>
            ) : data.length === 0 ? (
                <div className="report-empty" style={{ padding: 20 }}>Không có dữ liệu</div>
            ) : (
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tickFormatter={formatVND}
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalRevenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  Recent bookings mock table (sẽ thay bằng API thật)
// ─────────────────────────────────────────────
const STATUS_MAP = {
    CONFIRMED:  { label: "Đã xác nhận", cls: "available" },
    PENDING:    { label: "Đang xử lý",  cls: "occupied"  },
    CANCELLED:  { label: "Đã hủy",      cls: "unavailable" },
    COMPLETED:  { label: "Hoàn thành",  cls: "available" },
    WAITING_PAYMENT: { label: "Chờ thanh toán", cls: "maintenance" },
};

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function ReportOverview() {
    const [dayData,   setDayData]   = useState([]);
    const [monthData, setMonthData] = useState([]);
    const [yearData,  setYearData]  = useState([]);
    const [loading,   setLoading]   = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [r1, r2, r3] = await Promise.all([
                getRevenueByDay(monthsAgo(1), today()),
                getRevenueByMonth(monthsAgo(6), today()),
                getRevenueByYear(yearsAgo(5), today()),
            ]);
            setDayData(r1.data?.data?.details   || []);
            setMonthData(r2.data?.data?.details || []);
            setYearData(r3.data?.data?.details  || []);
        } catch (err) {
            console.error("Overview load error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <>
            {/* 3 mini charts */}
            <div className="overview-charts-grid">
                <MiniChartCard
                    title="DOANH THU THEO NGÀY (VNĐ)"
                    badge="+12%"
                    badgeClass="badge-up"
                    data={dayData}
                    loading={loading}
                />
                <MiniChartCard
                    title="DOANH THU THEO THÁNG (VNĐ)"
                    badge="Ổn định"
                    badgeClass="badge-flat"
                    data={monthData}
                    loading={loading}
                />
                <MiniChartCard
                    title="DOANH THU THEO NĂM (VNĐ)"
                    badge="+24%"
                    badgeClass="badge-up"
                    data={yearData}
                    loading={loading}
                />
            </div>

            {/* Recent bookings table — placeholder, connect BookingRepository if needed */}
            <div className="report-table-card">
                <div className="report-table-header">
                    <span className="report-table-title">Đặt phòng gần đây</span>
                </div>
                <div className="report-table-wrap">
                    <table className="report-table">
                        <thead>
                        <tr>
                            <th>MÃ ĐẶT PHÒNG</th>
                            <th>KHÁCH HÀNG</th>
                            <th>KHÔNG GIAN</th>
                            <th>NGÀY ĐẶT</th>
                            <th>NGÀY SỬ DỤNG</th>
                            <th>TỔNG TIỀN</th>
                            <th>TRẠNG THÁI</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td colSpan={7} style={{ padding: "32px", color: "#9ca3af", fontSize: 13 }}>
                                ← Kết nối API <code>/api/bookings?limit=10&sort=createdAt,desc</code> để hiển thị dữ liệu thực
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}