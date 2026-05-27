import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetail } from "../api/roomApi";
import { getSlotStatus, createBooking } from "../api/bookingApi";
import "./css/Booking.css";

const generateSlots = () => {
    const slots = [];
    for (let h = 8; h < 22; h++) {
        const s = `${String(h).padStart(2, "0")}:00`;
        const e = `${String(h + 1).padStart(2, "0")}:00`;
        slots.push({ label: `${s} - ${e}`, start: s, end: e });
    }
    return slots;
};
const ALL_SLOTS = generateSlots();

const vnd = (n) => Number(n).toLocaleString("vi-VN");

const TYPE_LABEL = {
    "Meeting Room": "Phòng họp",
    "Private Office": "Phòng làm việc riêng",
    "Coworking": "Coworking",
    "Virtual Office": "Văn phòng ảo",
    "Studio": "Studio",
    "Training Room": "Phòng đào tạo",
};

export default function Booking() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [lockedSlots, setLockedSlots] = useState([]);
    const [maintSlots, setMaintSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    /* ── Load room ── */
    useEffect(() => {
        (async () => {
            try {
                const r = await getRoomDetail(roomId);
                setRoom(r);
                // Chặn đặt phòng nếu phòng đang bảo trì hoặc ngừng hoạt động
                const s = r?.roomStatus?.toLowerCase();
                if (s && s !== "available") {
                    setErrorMsg("Phòng hiện không khả dụng để đặt. Vui lòng chọn phòng khác.");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [roomId]);

    /* ── Load slot status from backend ── */
    const loadSlots = useCallback(async () => {
        if (!selectedDate) return;
        try {
            const data = await getSlotStatus(roomId, selectedDate);
            setBookedSlots(data.booked || []);
            setLockedSlots(data.locked || []);
            setMaintSlots(data.maintenance || []);
        } catch {
            setBookedSlots([]);
            setLockedSlots([]);
            setMaintSlots([]);
        }
        setSelectedSlots([]);
    }, [selectedDate, roomId]);

    useEffect(() => {
        loadSlots();
        // Refresh slot status mỗi 30 giây để hiển thị realtime
        const interval = setInterval(loadSlots, 30_000);
        return () => clearInterval(interval);
    }, [loadSlots]);

    /* ── Toggle slot ── */
    const toggleSlot = (idx) => {
        if (
            bookedSlots.includes(idx) ||
            lockedSlots.includes(idx) ||
            maintSlots.includes(idx)
        )
            return;

        setSelectedSlots((prev) => {
            if (prev.includes(idx)) {
                const newList = prev.filter((i) => i !== idx);
                if (newList.length === 0) return [];
                const sorted = [...newList].sort((a, b) => a - b);
                const isConsec = sorted.every(
                    (v, i, a) => i === 0 || v === a[i - 1] + 1
                );
                return isConsec ? newList : [];
            }
            const newList = [...prev, idx].sort((a, b) => a - b);
            const isConsec = newList.every(
                (v, i, a) => i === 0 || v === a[i - 1] + 1
            );
            return isConsec ? newList : [idx];
        });
        setErrorMsg("");
    };

    /* ── Tính tiền ── */
    const hours = selectedSlots.length;
    const pricePerHour = Number(room?.price || 0);
    const subtotal = hours * pricePerHour;
    const serviceFee = 0; // Phí dịch vụ tính ở backend
    const total = subtotal + serviceFee;

    const getTimeRange = () => {
        if (selectedSlots.length === 0) return null;
        const sorted = [...selectedSlots].sort((a, b) => a - b);
        return {
            start: ALL_SLOTS[sorted[0]].start,
            end: ALL_SLOTS[sorted[sorted.length - 1]].end,
        };
    };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (selectedSlots.length === 0) {
            setErrorMsg("Vui lòng chọn ít nhất một khung giờ.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            // Chưa đăng nhập → lưu redirect và chuyển về trang đăng nhập
            sessionStorage.setItem("redirectAfterLogin", `/booking/${roomId}`);
            navigate("/login", {
                state: { message: "Vui lòng đăng nhập để đặt phòng." },
            });
            return;
        }

        const tr = getTimeRange();
        if (!tr) return;

        // Đã đăng nhập → tạo booking và chuyển sang trang thanh toán
        setSubmitting(true);
        setErrorMsg("");

        try {
            const booking = await createBooking({
                roomId: Number(roomId),
                date: selectedDate,
                startTime: tr.start + ":00",
                endTime: tr.end + ":00",
            });

            // Chuyển sang trang payment với thông tin booking
            navigate("/payment", { state: { booking } });
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "Đặt phòng thất bại. Vui lòng thử lại.";
            setErrorMsg(msg);
            // Refresh slot để hiển thị lock mới nhất
            loadSlots();
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="bk-loading">
                <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
            </div>
        );
    if (!room)
        return <div className="bk-loading">Không tìm thấy phòng.</div>;

    const typeLabel = TYPE_LABEL[room.workspaceType] || room.workspaceType;
    const tr = getTimeRange();

    return (
        <div className="bk-page">
            <div className="bk-breadcrumb">
                <span className="bk-bc-a" onClick={() => navigate("/")}>
                    Trang chủ
                </span>
                <span className="bk-bc-sep"> &gt; </span>
                <span className="bk-bc-a" onClick={() => navigate("/spaces")}>
                    Không gian
                </span>
                <span className="bk-bc-sep"> &gt; </span>
                <span>Đặt phòng</span>
            </div>

            <div className="bk-container">
                <h1 className="bk-title">Đặt phòng</h1>

                <div className="bk-layout">
                    {/* ── LEFT PANEL ── */}
                    <div className="bk-left">
                        <div className="bk-room-header">
                            <div className="bk-room-img-wrap">
                                {room.imageUrl ? (
                                    <img
                                        src={room.imageUrl}
                                        alt={room.name}
                                        className="bk-room-img"
                                    />
                                ) : (
                                    <div className="bk-room-img-ph" />
                                )}
                            </div>
                            <div className="bk-room-meta">
                                <div className="bk-room-name">{room.name}</div>
                                <span className="bk-room-tag">{typeLabel}</span>
                                <div className="bk-room-detail">
                                    <i className="fa-solid fa-user-group"></i>{" "}
                                    Sức chứa: {room.capacity} người
                                </div>
                                {room.location && (
                                    <div className="bk-room-detail">
                                        <i className="fa-solid fa-location-dot"></i>{" "}
                                        {room.location}
                                    </div>
                                )}
                                {room.openTime && room.closeTime && (
                                    <div className="bk-room-detail">
                                        <i className="fa-regular fa-clock"></i>{" "}
                                        {room.openTime?.slice(0, 5)} –{" "}
                                        {room.closeTime?.slice(0, 5)}
                                    </div>
                                )}
                                {room.amenities?.length > 0 && (
                                    <div className="bk-room-detail">
                                        <i className="fa-solid fa-star"></i>{" "}
                                        Tiện ích: {room.amenities.join(", ")}
                                    </div>
                                )}
                                <button
                                    className="bk-view-link"
                                    onClick={() => navigate(`/spaces/${roomId}`)}
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                            <div className="bk-date-wrap">
                                <label className="bk-date-label">Ngày</label>
                                <div className="bk-date-input-wrap">
                                    <i className="fa-regular fa-calendar bk-date-icon"></i>
                                    <input
                                        type="date"
                                        className="bk-date-input"
                                        value={selectedDate}
                                        min={new Date().toISOString().slice(0, 10)}
                                        onChange={(e) =>
                                            setSelectedDate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slot picker */}
                        <div className="bk-slots-wrap">
                            <div className="bk-slots-title">Chọn khung giờ</div>

                            {/* Legend */}
                            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13, flexWrap: "wrap" }}>
                                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#e2e8f0", borderRadius: 3, marginRight: 4 }}></span>Trống</span>
                                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#003db5", borderRadius: 3, marginRight: 4 }}></span>Đang chọn</span>
                                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#ef4444", borderRadius: 3, marginRight: 4 }}></span>Đã đặt</span>
                                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f59e0b", borderRadius: 3, marginRight: 4 }}></span>Đang giữ chỗ</span>
                                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#94a3b8", borderRadius: 3, marginRight: 4 }}></span>Bảo trì</span>
                            </div>

                            <div className="bk-slots-grid">
                                {ALL_SLOTS.map((slot, idx) => {
                                    const isBooked = bookedSlots.includes(idx);
                                    const isLocked = lockedSlots.includes(idx);
                                    const isMaint = maintSlots.includes(idx);
                                    const isSel = selectedSlots.includes(idx);
                                    let cls = "bk-slot";
                                    if (isBooked) cls += " slot-booked";
                                    else if (isLocked) cls += " slot-locked";
                                    else if (isMaint) cls += " slot-maint";
                                    else if (isSel) cls += " slot-sel";
                                    return (
                                        <div
                                            key={idx}
                                            className={cls}
                                            onClick={() => toggleSlot(idx)}
                                        >
                                            <div className="bk-slot-time">
                                                {slot.label}
                                            </div>
                                            {isBooked ? (
                                                <div className="bk-slot-sub">
                                                    <i className="fa-solid fa-lock"></i>{" "}
                                                    Đã được đặt
                                                </div>
                                            ) : isLocked ? (
                                                <div className="bk-slot-sub">
                                                    <i className="fa-solid fa-hourglass-half"></i>{" "}
                                                    Đang giữ chỗ
                                                </div>
                                            ) : isMaint ? (
                                                <div className="bk-slot-sub">
                                                    <i className="fa-solid fa-wrench"></i>{" "}
                                                    Bảo trì
                                                </div>
                                            ) : (
                                                <div className="bk-slot-sub">
                                                    {vnd(pricePerHour)}đ
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="bk-hint">
                                <i
                                    className="fa-solid fa-circle-info"
                                    style={{ color: "#003db5", marginRight: 6 }}
                                ></i>
                                Chỉ có thể chọn những khung giờ liền nhau.
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="bk-right">
                        <div className="bk-summary">
                            <div className="bk-sum-title">Thông tin đặt phòng</div>
                            <p className="bk-sum-sub">
                                Vui lòng kiểm tra thông tin trước khi tiếp tục
                            </p>

                            <div className="bk-sum-room">
                                <div className="bk-sum-img-wrap">
                                    {room.imageUrl ? (
                                        <img
                                            src={room.imageUrl}
                                            alt={room.name}
                                            className="bk-sum-img"
                                        />
                                    ) : (
                                        <div className="bk-sum-img-ph" />
                                    )}
                                </div>
                                <div className="bk-sum-room-info">
                                    <div className="bk-sum-room-name">{room.name}</div>
                                    <span className="bk-sum-tag">{typeLabel}</span>
                                    <div className="bk-sum-detail">
                                        <i className="fa-solid fa-user-group"></i> Sức
                                        chứa: {room.capacity} người
                                    </div>
                                    {room.location && (
                                        <div className="bk-sum-detail">
                                            <i className="fa-solid fa-location-dot"></i>{" "}
                                            {room.location}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bk-sum-section">
                                <div className="bk-sum-section-title">Thời gian đặt</div>
                                <div className="bk-sum-row">
                                    <span>
                                        <i className="fa-regular fa-calendar"></i> Ngày
                                    </span>
                                    <span className="bk-sum-val">
                                        {selectedDate || "—"}
                                    </span>
                                </div>
                                <div className="bk-sum-row">
                                    <span>
                                        <i className="fa-regular fa-clock"></i> Thời gian
                                    </span>
                                    <span className="bk-sum-val">
                                        {tr
                                            ? `${tr.start} – ${tr.end} (${hours} giờ)`
                                            : "Chưa chọn"}
                                    </span>
                                </div>
                            </div>

                            <div className="bk-sum-section">
                                <div className="bk-sum-section-title">
                                    Chi tiết thanh toán
                                </div>
                                <div className="bk-sum-row">
                                    <span>Đơn giá</span>
                                    <span>{vnd(pricePerHour)}đ/giờ</span>
                                </div>
                                <div className="bk-sum-row">
                                    <span>Thời gian</span>
                                    <span>{hours} giờ</span>
                                </div>
                                <div className="bk-sum-row">
                                    <span>Tạm tính</span>
                                    <span>{vnd(subtotal)}đ</span>
                                </div>
                                <div className="bk-sum-row">
                                    <span>Phí dịch vụ</span>
                                    <span>Miễn phí</span>
                                </div>
                            </div>

                            <div className="bk-sum-total-row">
                                <span className="bk-sum-total-label">Tổng tiền</span>
                                <span className="bk-sum-total-val">{vnd(total)}đ</span>
                            </div>

                            {errorMsg && (
                                <div className="bk-error">⚠️ {errorMsg}</div>
                            )}

                            <button
                                className="bk-submit-btn"
                                disabled={submitting || selectedSlots.length === 0 || !!errorMsg}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "TIẾP TỤC"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}