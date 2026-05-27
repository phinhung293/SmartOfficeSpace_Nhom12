/*roomdetail.jsx*/
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetail, getRealtimeStatus } from "../api/roomApi";
import "./css/Roomdetail.css";

/* ─── amenity icon map ─── */
const AMENITY_MAP = {
    "Wi-Fi":      { icon: "fa-wifi",            label: "Wi-Fi"      },
    "TV":         { icon: "fa-tv",              label: "TV"         },
    "Máy chiếu":  { icon: "fa-film",            label: "Máy chiếu"  },
    "Whiteboard": { icon: "fa-chalkboard",      label: "Whiteboard" },
    "Điều hòa":   { icon: "fa-temperature-low", label: "Điều hòa"   },
    "Nước uống":  { icon: "fa-glass-water",     label: "Nước uống"  },
    "Bãi xe":     { icon: "fa-square-parking",  label: "Bãi xe"     },
};

const TYPE_STYLE = {
    "Meeting Room":   { label:"Phòng họp",     cls:"tag-meeting"   },
    "Private Office": { label:"Phòng riêng",   cls:"tag-private"   },
    "Coworking":      { label:"Coworking",      cls:"tag-coworking" },
    "Phòng họp":      { label:"Phòng họp",     cls:"tag-meeting"   },
    "Phòng làm việc": { label:"Phòng làm việc",cls:"tag-private"   },
};

function AmenityItem({ name }) {
    const a = AMENITY_MAP[name] || { icon: "fa-check", label: name };
    return (
        <div className="rd-amenity">
            <div className="rd-amenity-icon"><i className={`fa-solid ${a.icon}`}></i></div>
            <span>{a.label}</span>
        </div>
    );
}

export default function RoomDetail() {
    const { roomId } = useParams();
    const navigate   = useNavigate();
    const [room,   setRoom]   = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [d, s] = await Promise.all([
                    getRoomDetail(roomId),
                    getRealtimeStatus(roomId),
                ]);
                setRoom(d); setStatus(s);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
        const iv = setInterval(async () => {
            try { setStatus(await getRealtimeStatus(roomId)); } catch {}
        }, 30000);
        return () => clearInterval(iv);
    }, [roomId]);

    if (loading) return <div className="rd-loading"><i className="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>;
    if (!room)   return <div className="rd-loading">Không tìm thấy phòng.</div>;

    // Backend trả về "Còn trống" / "Đang bận" (tiếng Việt) — kiểm tra cả hai ngôn ngữ để an toàn
    const isMaintenance = room.roomStatus?.toLowerCase() === "maintenance"
        || room.roomStatus === "Bảo trì"
        || room.roomStatus?.toLowerCase() === "bảo trì";
    // realtimeStatus từ /api/rooms/{id}/status trả về "Còn trống" hoặc "Đang bận"
    // roomStatus từ DB có thể là "Còn trống", "Available", "Bảo trì"...
    const realtimeAvail = status === "Còn trống" || status === "Available";
    const dbAvail = room.roomStatus === "Còn trống"
        || room.roomStatus?.toLowerCase() === "available"
        || room.roomStatus?.toLowerCase() === "còn trống";
    // Nếu đang bảo trì → không khả dụng; nếu không → ưu tiên realtime status
    const isAvail = !isMaintenance && (status != null ? realtimeAvail : dbAvail);
    const statusLabel = isAvail ? "Còn trống" : isMaintenance ? "Bảo trì" : "Đang bận";
    const { label: typeLabel, cls: typeCls } = TYPE_STYLE[room.workspaceType] || { label: room.workspaceType, cls: "tag-default" };
    const descFull  = room.description || "";
    const descShort = descFull.length > 200 ? descFull.slice(0, 200) : descFull;

    return (
        <div className="rd-page">
            {/* Breadcrumb */}
            <div className="rd-breadcrumb">
                <span className="rd-bc-a" onClick={() => navigate("/")}>Trang chủ</span>
                <span className="rd-bc-sep"> &gt; </span>
                <span className="rd-bc-a" onClick={() => navigate("/spaces")}>Không gian</span>
                <span className="rd-bc-sep"> &gt; </span>
                <span>Xem chi tiết</span>
            </div>

            <div className="rd-container">
                <h1 className="rd-page-h">Xem chi tiết</h1>

                {/* ── Main card ── */}
                <div className="rd-card">
                    {/* Image */}
                    <div className="rd-img-wrap">
                        <span className={`rd-badge ${isAvail ? "rd-badge-ok" : "rd-badge-busy"}`}>
                            {statusLabel}
                        </span>
                        {room.imageUrl
                            ? <img src={room.imageUrl} alt={room.name} className="rd-img" />
                            : <div className="rd-img-ph" />}
                    </div>

                    {/* Info */}
                    <div className="rd-info">
                        <h2 className="rd-room-name">{room.name}</h2>
                        <span className={`rd-tag ${typeCls}`}>{typeLabel}</span>

                        <p className="rd-short-desc">{descFull.slice(0, 100)}{descFull.length > 100 ? "..." : ""}</p>

                        <div className="rd-meta-block">
                            <div className="rd-meta-row">
                                <span className="rd-ml"><i className="fa-regular fa-user"></i> Sức chứa</span>
                                <span className="rd-mv">Tối đa {room.capacity} người</span>
                            </div>
                            {room.openTime && room.closeTime && (
                                <div className="rd-meta-row">
                                    <span className="rd-ml"><i className="fa-regular fa-clock"></i> Thời gian hoạt động</span>
                                    <span className="rd-mv">{room.openTime?.slice(0,5)} – {room.closeTime?.slice(0,5)}</span>
                                </div>
                            )}
                            {room.location && (
                                <div className="rd-meta-row">
                                    <span className="rd-ml"><i className="fa-solid fa-location-dot"></i> Vị trí</span>
                                    <span className="rd-mv">{room.location}</span>
                                </div>
                            )}
                        </div>

                        <div className="rd-price-row">
                            <span className="rd-price">{Number(room.price).toLocaleString("vi-VN")}đ/giờ</span>
                            <button
                                className="rd-book-btn"
                                disabled={!isAvail}
                                style={!isAvail ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                                onClick={() => isAvail && navigate(`/booking/${room.roomId}`)}>
                                {isMaintenance ? '🔧 Đang bảo trì' : !isAvail ? 'Phòng không khả dụng' : 'Đặt phòng ngay'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Amenities ── */}
                {room.amenities?.length > 0 && (
                    <div className="rd-section">
                        <h3 className="rd-section-h">Tiện ích</h3>
                        <div className="rd-amenity-grid">
                            {room.amenities.map((a, i) => <AmenityItem key={i} name={a} />)}
                        </div>
                    </div>
                )}

                {/* ── Description ── */}
                {descFull && (
                    <div className="rd-section">
                        <h3 className="rd-section-h">Mô tả chi tiết</h3>
                        <p className="rd-desc-text">
                            {expanded ? descFull : descShort}
                            {descFull.length > 200 && !expanded ? "..." : ""}
                        </p>
                        {descFull.length > 200 && (
                            <button className="rd-expand-btn"
                                    onClick={() => setExpanded(x => !x)}>
                                {expanded ? "Thu gọn" : "Xem thêm"}
                                <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`}
                                   style={{ marginLeft: 6 }}></i>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}