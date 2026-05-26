import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetail } from "../api/roomApi";
import "./css/Booking.css";
import axios from "axios";

const API = "http://localhost:8080/api";

/* ── Tạo các khung giờ từ 08:00 đến 22:00 ── */
const generateSlots = () => {
    const slots = [];
    for (let h = 8; h < 22; h++) {
        const s = `${String(h).padStart(2,"0")}:00`;
        const e = `${String(h+1).padStart(2,"0")}:00`;
        slots.push({ label: `${s} - ${e}`, start: s, end: e });
    }
    return slots;
};
const ALL_SLOTS = generateSlots();

/* ── Format tiền VND ── */
const vnd = n => Number(n).toLocaleString("vi-VN");

/* ── Map type sang tiếng Việt ── */
const TYPE_LABEL = {
    "Phòng họp":      "Phòng họp",
    "Phòng làm việc": "Phòng làm việc",
    "Coworking":      "Coworking",
    "Meeting Room":   "Phòng họp",
    "Private Office": "Phòng làm việc",
};

export default function Booking() {
    const { roomId } = useParams();
    const navigate   = useNavigate();

    const [room,         setRoom]         = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return d.toISOString().slice(0,10);
    });
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [bookedSlots,   setBookedSlots]   = useState([]);
    const [maintSlots,    setMaintSlots]    = useState([]);
    const [submitting,    setSubmitting]    = useState(false);
    const [errorMsg,      setErrorMsg]      = useState("");

    /* ── Load room ── */
    useEffect(() => {
        (async () => {
            try { setRoom(await getRoomDetail(roomId)); }
            catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [roomId]);

    /* ── Load booked slots for selected date ── */
    useEffect(() => {
        if (!selectedDate) return;
        (async () => {
            try {
                const res = await axios.get(`${API}/bookings/slots`, {
                    params: { roomId, date: selectedDate }
                });
                const data = res.data || {};
                setBookedSlots(data.booked || []);
                setMaintSlots(data.maintenance || []);
            } catch {
                setBookedSlots([]); setMaintSlots([]);
            }
            setSelectedSlots([]);
        })();
    }, [selectedDate, roomId]);

    /* ── Toggle slot (phải liên tiếp) ── */
    const toggleSlot = (idx) => {
        if (bookedSlots.includes(idx) || maintSlots.includes(idx)) return;
        setSelectedSlots(prev => {
            if (prev.includes(idx)) {
                const newList = prev.filter(i => i !== idx);
                if (newList.length === 0) return [];
                const sorted = [...newList].sort((a,b)=>a-b);
                const isConsec = sorted.every((v,i,a) => i===0 || v === a[i-1]+1);
                return isConsec ? newList : [];
            }
            const newList = [...prev, idx].sort((a,b)=>a-b);
            const isConsec = newList.every((v,i,a) => i===0 || v === a[i-1]+1);
            if (!isConsec) return [idx];
            return newList;
        });
        setErrorMsg("");
    };

    /* ── Tính tiền ── */
    const hours = selectedSlots.length;
    const pricePerHour = Number(room?.price || 0);
    const subtotal = hours * pricePerHour;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;

    /* ── Thời gian đặt ── */
    const getTimeRange = () => {
        if (selectedSlots.length === 0) return null;
        const sorted = [...selectedSlots].sort((a,b)=>a-b);
        return {
            start: ALL_SLOTS[sorted[0]].start,
            end:   ALL_SLOTS[sorted[sorted.length-1]].end,
        };
    };

    /* ── Submit: kiểm tra đăng nhập tại đây, không phải tại route ── */
    const handleSubmit = async () => {
        if (selectedSlots.length === 0) {
            setErrorMsg("Vui lòng chọn ít nhất một khung giờ.");
            return;
        }

        // Kiểm tra đăng nhập chỉ khi bấm "Tiếp tục thanh toán"
        const userStr = localStorage.getItem("user");
        const token   = localStorage.getItem("token");
        let user = null;
        try { user = userStr ? JSON.parse(userStr) : null; } catch {}

        if (!user?.userId || !token) {
            // Lưu lại trang hiện tại để redirect về sau khi đăng nhập
            sessionStorage.setItem("redirectAfterLogin", `/booking/${roomId}`);
            navigate("/login");
            return;
        }

        // Thông báo trang thanh toán chưa hoàn thiện
        alert("⚠️ Trang thanh toán hiện chưa hoàn thiện.\n\nChúng tôi đang phát triển tính năng này và sẽ sớm cập nhật. Xin lỗi vì sự bất tiện!");
    };

    /* ── Render ── */
    if (loading) return <div className="bk-loading"><i className="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>;
    if (!room)   return <div className="bk-loading">Không tìm thấy phòng.</div>;

    const typeLabel = TYPE_LABEL[room.workspaceType] || room.workspaceType;
    const tr = getTimeRange();

    return (
        <div className="bk-page">
            {/* Breadcrumb */}
            <div className="bk-breadcrumb">
                <span className="bk-bc-a" onClick={() => navigate("/")}>Trang chủ</span>
                <span className="bk-bc-sep"> &gt; </span>
                <span className="bk-bc-a" onClick={() => navigate("/spaces")}>Không gian</span>
                <span className="bk-bc-sep"> &gt; </span>
                <span>Đặt phòng</span>
            </div>

            {/* Banner thông báo trang chưa hoàn thiện */}
            <div className="bk-dev-banner">
                <i className="fa-solid fa-triangle-exclamation"></i>
                &nbsp; Trang thanh toán hiện <strong>chưa hoàn thiện</strong>. Bạn có thể chọn giờ và xem chi tiết đặt phòng, nhưng chức năng thanh toán thực tế đang được phát triển.
            </div>

            <div className="bk-container">
                <h1 className="bk-title">Đặt phòng</h1>

                <div className="bk-layout">
                    {/* ── LEFT PANEL ── */}
                    <div className="bk-left">
                        {/* Room header */}
                        <div className="bk-room-header">
                            <div className="bk-room-img-wrap">
                                {room.imageUrl
                                    ? <img src={room.imageUrl} alt={room.name} className="bk-room-img"/>
                                    : <div className="bk-room-img-ph"/>}
                            </div>
                            <div className="bk-room-meta">
                                <div className="bk-room-name">{room.name}</div>
                                <span className="bk-room-tag">{typeLabel}</span>
                                <div className="bk-room-detail">
                                    <i className="fa-solid fa-user-group"></i> Sức chứa: {room.capacity} người
                                </div>
                                {room.location && (
                                    <div className="bk-room-detail">
                                        <i className="fa-solid fa-location-dot"></i> {room.location}
                                    </div>
                                )}
                                {room.openTime && room.closeTime && (
                                    <div className="bk-room-detail">
                                        <i className="fa-regular fa-clock"></i> {room.openTime?.slice(0,5)} – {room.closeTime?.slice(0,5)}
                                    </div>
                                )}
                                {room.amenities?.length > 0 && (
                                    <div className="bk-room-detail">
                                        <i className="fa-solid fa-star"></i> Tiện ích: {room.amenities.join(", ")}
                                    </div>
                                )}
                                <button className="bk-view-link"
                                        onClick={() => navigate(`/spaces/${roomId}`)}>
                                    Xem chi tiết
                                </button>
                            </div>
                            {/* Date picker */}
                            <div className="bk-date-wrap">
                                <label className="bk-date-label">Ngày</label>
                                <div className="bk-date-input-wrap">
                                    <i className="fa-regular fa-calendar bk-date-icon"></i>
                                    <input type="date" className="bk-date-input"
                                           value={selectedDate}
                                           min={new Date().toISOString().slice(0,10)}
                                           onChange={e => setSelectedDate(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Slot picker */}
                        <div className="bk-slots-wrap">
                            <div className="bk-slots-title">Chọn khung giờ</div>
                            <div className="bk-slots-grid">
                                {ALL_SLOTS.map((slot, idx) => {
                                    const isBooked = bookedSlots.includes(idx);
                                    const isMaint  = maintSlots.includes(idx);
                                    const isSel    = selectedSlots.includes(idx);
                                    let cls = "bk-slot";
                                    if (isBooked) cls += " slot-booked";
                                    else if (isMaint) cls += " slot-maint";
                                    else if (isSel) cls += " slot-sel";
                                    return (
                                        <div key={idx} className={cls}
                                             onClick={() => toggleSlot(idx)}>
                                            <div className="bk-slot-time">{slot.label}</div>
                                            {isBooked
                                                ? <div className="bk-slot-sub"><i className="fa-solid fa-lock"></i> Đã được đặt</div>
                                                : isMaint
                                                    ? <div className="bk-slot-sub"><i className="fa-solid fa-wrench"></i> Bảo trì</div>
                                                    : <div className="bk-slot-sub">{vnd(pricePerHour)}đ</div>
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="bk-hint">
                                <i className="fa-solid fa-circle-info" style={{color:"#003db5",marginRight:6}}></i>
                                Chỉ có thể chọn những khung giờ liền nhau. Không thể chọn rời rạc!
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL – Booking summary ── */}
                    <div className="bk-right">
                        <div className="bk-summary">
                            <div className="bk-sum-title">Thông tin đặt phòng</div>
                            <p className="bk-sum-sub">Vui lòng kiểm tra thông tin đặt phòng trước khi tiếp tục</p>

                            {/* Room preview */}
                            <div className="bk-sum-room">
                                <div className="bk-sum-img-wrap">
                                    {room.imageUrl
                                        ? <img src={room.imageUrl} alt={room.name} className="bk-sum-img"/>
                                        : <div className="bk-sum-img-ph"/>}
                                </div>
                                <div className="bk-sum-room-info">
                                    <div className="bk-sum-room-name">{room.name}</div>
                                    <span className="bk-sum-tag">{typeLabel}</span>
                                    <div className="bk-sum-detail">
                                        <i className="fa-solid fa-user-group"></i> Sức chứa: {room.capacity} người
                                    </div>
                                    {room.location && (
                                        <div className="bk-sum-detail">
                                            <i className="fa-solid fa-location-dot"></i> {room.location}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Time info */}
                            <div className="bk-sum-section">
                                <div className="bk-sum-section-title">Thời gian đặt</div>
                                <div className="bk-sum-row">
                                    <span><i className="fa-regular fa-calendar"></i> Ngày</span>
                                    <span className="bk-sum-val">{selectedDate || "—"}</span>
                                </div>
                                <div className="bk-sum-row">
                                    <span><i className="fa-regular fa-clock"></i> Thời gian</span>
                                    <span className="bk-sum-val">
                                        {tr ? `${tr.start} – ${tr.end} (${hours} giờ)` : "Chưa chọn"}
                                    </span>
                                </div>
                            </div>

                            {/* Payment breakdown */}
                            <div className="bk-sum-section">
                                <div className="bk-sum-section-title">Chi tiết thanh toán</div>
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
                                    <span>Phí dịch vụ (5%)</span>
                                    <span>{vnd(serviceFee)}đ</span>
                                </div>
                            </div>

                            <div className="bk-sum-total-row">
                                <span className="bk-sum-total-label">Tổng tiền</span>
                                <span className="bk-sum-total-val">{vnd(total)}đ</span>
                            </div>

                            {errorMsg && <div className="bk-error">⚠️ {errorMsg}</div>}

                            <button className="bk-submit-btn"
                                    disabled={submitting || selectedSlots.length === 0}
                                    onClick={handleSubmit}>
                                {submitting
                                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                                    : "TIẾP TỤC THANH TOÁN"}
                            </button>

                            <p className="bk-payment-notice">
                                <i className="fa-solid fa-circle-info"></i>
                                &nbsp;Tính năng thanh toán đang được phát triển
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
