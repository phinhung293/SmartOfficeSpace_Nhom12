import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings } from "../api/bookingApi";

const vnd = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS_MAP = {
    PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#b45309", bg: "#fef3c7" },
    CONFIRMED:       { label: "Đã xác nhận",    color: "#1a7f3c", bg: "#dcfce7" },
    CANCELLED:       { label: "Đã hủy",         color: "#ef4444", bg: "#fee2e2" },
    EXPIRED:         { label: "Hết hạn",         color: "#64748b", bg: "#f1f5f9" },
};

const fmt = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const fmtTime = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export default function BookingHistory() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const token = localStorage.getItem("token");

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getMyBookings(page, 10);
            setBookings(result.content || []);
            setTotalPages(result.totalPages || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (!token) {
            navigate("/login", { state: { message: "Vui lòng đăng nhập để xem lịch sử đặt phòng." } });
            return;
        }
        fetchBookings();
    }, [fetchBookings, token, navigate]);

    const getStatusBadge = (status) => {
        const s = STATUS_MAP[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
        return (
            <span style={{
                background: s.bg, color: s.color,
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div style={{ minHeight: "70vh", padding: "40px 20px", maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                    Lịch sử đặt phòng
                </h1>
                <p style={{ color: "#64748b", fontSize: 14 }}>Tất cả đơn đặt phòng của bạn</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
                    <p style={{ marginTop: 12 }}>Đang tải...</p>
                </div>
            ) : bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <i className="fa-regular fa-calendar-xmark" style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 16 }}></i>
                    <p style={{ color: "#64748b" }}>Bạn chưa có đơn đặt phòng nào.</p>
                    <button
                        onClick={() => navigate("/spaces")}
                        style={{ marginTop: 16, padding: "10px 24px", background: "#003db5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                        Tìm phòng ngay
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {bookings.map((b) => (
                            <div
                                key={b.bookingId}
                                onClick={() => setSelectedBooking(b === selectedBooking ? null : b)}
                                style={{
                                    background: "#fff", borderRadius: 12,
                                    border: `1.5px solid ${b === selectedBooking ? "#003db5" : "#e2e8f0"}`,
                                    padding: "16px 20px", cursor: "pointer",
                                    transition: "border-color 0.2s",
                                    display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center"
                                }}
                            >
                                {/* Image */}
                                <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                                    {b.roomImageUrl
                                        ? <img src={b.roomImageUrl} alt={b.roomName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : <div style={{ width: "100%", height: "100%", background: "#e2e8f0" }} />
                                    }
                                </div>

                                {/* Main info */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{b.roomName}</div>
                                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>
                                        <i className="fa-regular fa-calendar" style={{ marginRight: 6 }}></i>
                                        {new Date(b.startTime).toLocaleDateString("vi-VN")} &nbsp;|&nbsp;
                                        {fmtTime(b.startTime)} – {fmtTime(b.endTime)} ({b.durationHours} giờ)
                                    </div>
                                    <div style={{ fontSize: 13, color: "#64748b" }}>
                                        Mã đơn: <strong>{b.bookingCode}</strong>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, color: "#003db5", fontSize: 16 }}>
                                        {vnd(b.totalAmount)}đ
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        {getStatusBadge(b.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expanded detail */}
                    {selectedBooking && (
                        <div style={{
                            marginTop: 16, background: "#f8fafc", borderRadius: 12,
                            border: "1px solid #e2e8f0", padding: 20
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>Chi tiết đơn #{selectedBooking.bookingCode}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 14 }}>
                                <div><span style={{ color: "#64748b" }}>Loại phòng:</span> {selectedBooking.workspaceType}</div>
                                <div><span style={{ color: "#64748b" }}>Đặt lúc:</span> {fmt(selectedBooking.createdAt)}</div>
                                <div><span style={{ color: "#64748b" }}>Tổng tiền:</span> <strong>{vnd(selectedBooking.totalAmount)}đ</strong></div>
                                <div><span style={{ color: "#64748b" }}>Trạng thái:</span> {getStatusBadge(selectedBooking.status)}</div>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    style={{
                                        width: 36, height: 36, borderRadius: "50%", border: "1.5px solid",
                                        borderColor: i === page ? "#003db5" : "#e2e8f0",
                                        background: i === page ? "#003db5" : "#fff",
                                        color: i === page ? "#fff" : "#1e293b",
                                        fontWeight: 600, cursor: "pointer", fontSize: 14
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}