import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const vnd = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function Payment() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const booking = state?.booking;

    const formatTime = (dt) => {
        if (!dt) return "—";
        const d = new Date(dt);
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };
    const formatDate = (dt) => {
        if (!dt) return "—";
        const d = new Date(dt);
        return d.toLocaleDateString("vi-VN");
    };

    // Nếu không có thông tin booking (truy cập trực tiếp URL)
    if (!booking) {
        return (
            <div style={{
                minHeight: "70vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px"
            }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
                        Trang thanh toán
                    </h1>
                    <p style={{ color: "#64748b", fontSize: 15 }}>
                        Vui lòng chọn phòng và đặt phòng trước khi thanh toán.
                    </p>
                    <button
                        onClick={() => navigate("/spaces")}
                        style={{
                            marginTop: 24, padding: "10px 28px", borderRadius: 8,
                            background: "#003db5", color: "#fff", border: "none",
                            fontWeight: 600, cursor: "pointer", fontSize: 14
                        }}
                    >
                        Tìm phòng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px"
        }}>
            <div style={{
                maxWidth: 520, width: "100%", background: "#fff",
                borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                padding: 40, textAlign: "center"
            }}>

                {/* Icon */}
                <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "#fef3c7", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px"
                }}>
                    <i className="fa-solid fa-credit-card" style={{ fontSize: 32, color: "#f59e0b" }}></i>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                    Trang thanh toán
                </h2>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
                    Chúng tôi đang hoàn thiện tính năng thanh toán. Đơn đặt phòng của bạn đã được ghi nhận và đang chờ xác nhận.
                </p>

                {/* Booking detail card */}
                <div style={{
                    background: "#f8fafc", borderRadius: 12,
                    padding: 20, marginBottom: 24, textAlign: "left"
                }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, fontSize: 15 }}>
                        Chi tiết đơn đặt phòng
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Mã đơn</span>
                        <span style={{ fontWeight: 600, color: "#003db5", fontSize: 13 }}>{booking.bookingCode}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Phòng</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{booking.roomName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Ngày</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(booking.startTime)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#64748b", fontSize: 13 }}>Thời gian</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {formatTime(booking.startTime)} – {formatTime(booking.endTime)} ({booking.durationHours} giờ)
                        </span>
                    </div>
                    <div style={{
                        borderTop: "1px solid #e2e8f0",
                        marginTop: 12, paddingTop: 12,
                        display: "flex", justifyContent: "space-between"
                    }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Tổng tiền</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#003db5" }}>
                            {vnd(booking.totalAmount)}đ
                        </span>
                    </div>

                    {/* Trạng thái */}
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            fontSize: 12, background: "#fef3c7", color: "#b45309",
                            padding: "3px 10px", borderRadius: 20, fontWeight: 600
                        }}>
                            Chờ thanh toán
                        </span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                            Slot giữ chỗ trong 5 phút
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button
                        onClick={() => navigate("/my-bookings")}
                        style={{
                            padding: "10px 24px", borderRadius: 8,
                            border: "1.5px solid #003db5", background: "#fff",
                            color: "#003db5", fontWeight: 600, cursor: "pointer", fontSize: 14
                        }}
                    >
                        Xem lịch sử đặt phòng
                    </button>
                    <button
                        onClick={() => navigate("/spaces")}
                        style={{
                            padding: "10px 24px", borderRadius: 8, border: "none",
                            background: "#003db5", color: "#fff", fontWeight: 600,
                            cursor: "pointer", fontSize: 14
                        }}
                    >
                        Tìm phòng khác
                    </button>
                </div>
            </div>
        </div>
    );
}
