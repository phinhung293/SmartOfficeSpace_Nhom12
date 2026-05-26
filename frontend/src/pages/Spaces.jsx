/*Space.jsx*/
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Spaces.css";
import { searchRooms } from "../api/roomApi";

/* ─────────────────────────────── constants ─────────────────────────────── */
const TYPE_STYLE = {
    "Meeting Room":   { label: "Phòng họp",     cls: "tag-meeting"   },
    "Private Office": { label: "Phòng riêng",   cls: "tag-private"   },
    "Coworking":      { label: "Coworking",      cls: "tag-coworking" },
    "Phòng họp":      { label: "Phòng họp",     cls: "tag-meeting"   },
    "Phòng làm việc": { label: "Phòng làm việc riêng", cls: "tag-private"  },
};
const getTypeStyle = t => TYPE_STYLE[t] || { label: t, cls: "tag-default" };

const AMENITY_OPTIONS = [
    { id: 1, label: "WIFI" }, { id: 2, label: "Máy chiếu" },
    { id: 3, label: "TV" },   { id: 4, label: "Whiteboard" },
    { id: 5, label: "Điều hòa" }, { id: 6, label: "Nước/Đồ ăn" },
    { id: 7, label: "Bãi xe" },   { id: 8, label: "Khác" },
];
const PRICE_OPTIONS = [
    { label: "0 - 100.000đ",         min: 0,      max: 100000 },
    { label: "100.000đ - 300.000đ",  min: 100000, max: 300000 },
    { label: "300.000đ - 500.000đ",  min: 300000, max: 500000 },
];
const WORKSPACE_OPTIONS = [
    { id: null, label: "Tất cả" }, { id: 1, label: "Phòng họp" },
    { id: 2, label: "Phòng làm việc riêng" },
    { id: 3, label: "Coworking" },
];
const CAPACITY_OPTIONS = [
    { value: "", label: "Số lượng người" }, { value: "1", label: "1 người" },
    { value: "2", label: "2 người" }, { value: "4", label: "4 người" },
    { value: "6", label: "6 người" }, { value: "10", label: "10 người" },
];
const STATUS_OPTIONS = [
    { id: null, label: "Tất cả" }, { id: 1, label: "Còn trống" },
    { id: 2, label: "Đã đặt" },    { id: 3, label: "Đang hoạt động" },
];
const LOCATION_OPTIONS = ["", "Tầng 1", "Tầng 2","Tầng 3","Tầng 4","Tầng 5","Tầng 6", "Tầng 7", "Tầng 8"];
const TIME_RANGES = [
    "08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00",
    "12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00",
    "16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00",
];
const SORT_OPTIONS = [
    { value: "",         dir: "asc",  label: "Mặc định" },
    { value: "price",    dir: "asc",  label: "Giá tăng dần" },
    { value: "price",    dir: "desc", label: "Giá giảm dần" },
    { value: "capacity", dir: "asc",  label: "Sức chứa tăng dần" },
    { value: "capacity", dir: "desc", label: "Sức chứa giảm dần" },
    { value: "name",     dir: "asc",  label: "Tên A → Z" },
    { value: "name",     dir: "desc", label: "Tên Z → A" },
];

/* ─────────────────────────── default states ───────────────────────────── */
// Search state (thanh tìm kiếm trên cùng)
const DEFAULT_SEARCH = { date: "", time: "", capacity: "" };
// Filter state (bộ lọc nâng cao)
const DEFAULT_FILTER = {
    workspaceTypeId: null, minPrice: null, maxPrice: null,
    amenityIds: [], statusId: null, location: "",
};

/* ═══════════════════════════ Sub-components ════════════════════════════ */

function StatusBadge({ status }) {
    const ok = status?.toLowerCase() === "available" || status === "Còn trống";
    return (
        <span className={`sp-status-badge ${ok ? "badge-ok" : "badge-busy"}`}>
            {ok ? "Còn trống" : (status || "—")}
        </span>
    );
}

function RoomCard({ room, onDetail }) {
    const { label, cls } = getTypeStyle(room.workspaceType);
    return (
        <div className="rc-card">
            <div className="rc-img-wrap">
                <StatusBadge status={room.roomStatus} />
                {room.imageUrl
                    ? <img src={room.imageUrl} alt={room.name} className="rc-img" />
                    : <div className="rc-img-placeholder" />}
            </div>
            <div className="rc-body">
                <div className="rc-top">
                    <span className="rc-name">{room.name}</span>
                    <span className={`rc-tag ${cls}`}>{label}</span>
                </div>
                <div className="rc-meta">
                    <span><i className="fa-solid fa-users"></i>{" "}{room.capacity} Người</span>
                    <span>
                        <i className="fa-solid fa-tv"></i>{" "}
                        {room.amenities?.join(", ") || "—"}
                    </span>
                </div>
                <p className="rc-desc">{room.description}</p>
                <div className="rc-price">{Number(room.price).toLocaleString("vi-VN")}đ/giờ</div>
            </div>
            <div className="rc-action">
                <button className="rc-btn-detail" onClick={() => onDetail(room.roomId)}>
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}

function Pagination({ current, total, onChange }) {
    if (total <= 1) return null;
    const pages = [];
    for (let i = 0; i < total; i++) pages.push(i);
    return (
        <div className="pag-wrap">
            <button className="pag-btn" disabled={current === 0} onClick={() => onChange(0)}>«</button>
            <button className="pag-btn" disabled={current === 0} onClick={() => onChange(current - 1)}>‹</button>
            {pages.map(i => (
                <button key={i} className={`pag-btn${current === i ? " pag-active" : ""}`}
                        onClick={() => onChange(i)}>{i + 1}</button>
            ))}
            <button className="pag-btn" disabled={current === total - 1} onClick={() => onChange(current + 1)}>›</button>
            <button className="pag-btn" disabled={current === total - 1} onClick={() => onChange(total - 1)}>»</button>
        </div>
    );
}

/* ─────────────────────── Filter Modal ─────────────────────────── */
function FilterModal({ init, onApply, onClose }) {
    const [local, setLocal] = useState({ ...init });

    const toggleAmenity = id => setLocal(p => ({
        ...p,
        amenityIds: p.amenityIds.includes(id)
            ? p.amenityIds.filter(a => a !== id)
            : [...p.amenityIds, id],
    }));
    const setPrice = (min, max) => {
        const same = local.minPrice === min && local.maxPrice === max;
        setLocal(p => ({ ...p, minPrice: same ? null : min, maxPrice: same ? null : max }));
    };
    const resetLocal = () => setLocal({ ...DEFAULT_FILTER });

    return (
        <div className="fm-overlay" onClick={onClose}>
            <div className="fm-modal" onClick={e => e.stopPropagation()}>
                {/* header */}
                <div className="fm-head">
                    <span className="fm-title">Bộ lọc nâng cao</span>
                    <button className="fm-reset-btn" onClick={resetLocal}>
                        <i className="fa-solid fa-rotate-left"></i> Xóa tất cả
                    </button>
                </div>

                <div className="fm-body">
                    {/* COL 1 */}
                    <div className="fm-col">
                        <div className="fm-section">
                            <div className="fm-label">Loại không gian</div>
                            {WORKSPACE_OPTIONS.map(o => (
                                <label key={String(o.id)} className="fm-row">
                                    <input type="checkbox" className="fm-check"
                                           checked={local.workspaceTypeId === o.id}
                                           onChange={() => setLocal(p => ({ ...p, workspaceTypeId: o.id }))} />
                                    {o.label}
                                </label>
                            ))}
                        </div>
                        <div className="fm-section">
                            <div className="fm-label">Sức chứa</div>
                            <select className="fm-select"
                                    value={local.capacity || ""}
                                    onChange={e => setLocal(p => ({ ...p, capacity: e.target.value }))}>
                                {CAPACITY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* COL 2 */}
                    <div className="fm-col">
                        <div className="fm-section">
                            <div className="fm-label">Khoảng giá</div>
                            {PRICE_OPTIONS.map(o => (
                                <label key={o.label} className="fm-row">
                                    <input type="checkbox" className="fm-check"
                                           checked={local.minPrice === o.min && local.maxPrice === o.max}
                                           onChange={() => setPrice(o.min, o.max)} />
                                    {o.label}
                                </label>
                            ))}
                        </div>
                        <div className="fm-section">
                            <div className="fm-label">Tiện ích</div>
                            <div className="fm-amenity-grid">
                                {AMENITY_OPTIONS.map(o => (
                                    <label key={o.id} className="fm-row">
                                        <input type="checkbox" className="fm-check"
                                               checked={local.amenityIds.includes(o.id)}
                                               onChange={() => toggleAmenity(o.id)} />
                                        {o.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COL 3 */}
                    <div className="fm-col">
                        <div className="fm-section">
                            <div className="fm-label">Vị trí</div>
                            <select className="fm-select"
                                    value={local.location}
                                    onChange={e => setLocal(p => ({ ...p, location: e.target.value }))}>
                                <option value="">Tất cả vị trí</option>
                                {LOCATION_OPTIONS.filter(l => l).map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div className="fm-section">
                            <div className="fm-label">Trạng thái</div>
                            {STATUS_OPTIONS.map(o => (
                                <label key={String(o.id)} className="fm-row">
                                    <input type="checkbox" className="fm-check"
                                           checked={local.statusId === o.id}
                                           onChange={() => setLocal(p => ({ ...p, statusId: o.id }))} />
                                    {o.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* footer */}
                <div className="fm-foot">
                    <button className="fm-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="fm-btn-apply" onClick={() => { onApply(local); onClose(); }}>
                        Áp dụng
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════ Main Component ══════════════════════════════ */
export default function Spaces() {
    const navigate = useNavigate();

    // 3 state độc lập: search / filter / sort
    const [search,    setSearch]    = useState({ ...DEFAULT_SEARCH });
    const [filter,    setFilter]    = useState({ ...DEFAULT_FILTER });
    const [sortKey,   setSortKey]   = useState(""); // index vào SORT_OPTIONS

    // UI state
    const [showFilter, setShowFilter] = useState(false);
    const [page,       setPage]       = useState(0);
    const [rooms,      setRooms]      = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading,    setLoading]    = useState(false);
    const [errorMsg,   setErrorMsg]   = useState("");

    // Ref để tránh double-fetch khi mount
    const mountedRef = useRef(false);

    /* ── build payload từ cả 3 nguồn ─────────────────────────── */
    const buildPayload = (s, f, sk, pg) => {
        const sortOpt = SORT_OPTIONS[parseInt(sk)] || SORT_OPTIONS[0];
        let startTime = null, endTime = null;
        if (s.time) { [startTime, endTime] = s.time.split("-"); }
        const hasTime = !!(s.date && s.time);
        return {
            // search
            capacity:   s.capacity ? parseInt(s.capacity) : null,
            date:       hasTime ? s.date        : null,
            startTime:  hasTime ? startTime     : null,
            endTime:    hasTime ? endTime        : null,
            // filter
            workspaceTypeId: f.workspaceTypeId,
            minPrice:        f.minPrice,
            maxPrice:        f.maxPrice,
            amenityIds:      f.amenityIds.length > 0 ? f.amenityIds : null,
            statusId:        f.statusId,
            // sort
            sortBy:        sortOpt.value || null,
            sortDirection: sortOpt.dir,
            // pagination
            page: pg,
            size: 6,
        };
    };

    /* ── fetch ─────────────────────────────────────────────────── */
    const doFetch = async (s, f, sk, pg) => {
        if (s.date && !s.time) { setErrorMsg("Vui lòng chọn thêm thời gian."); return; }
        if (!s.date && s.time) { setErrorMsg("Vui lòng chọn thêm ngày."); return; }
        setErrorMsg("");
        setLoading(true);
        try {
            const payload = buildPayload(s, f, sk, pg);
            const res = await searchRooms(payload);
            setRooms(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch (e) {
            console.error(e);
            setErrorMsg("Lỗi kết nối server.");
        } finally {
            setLoading(false);
        }
    };

    /* ── load khi mount ─────────────────────────────────────────── */
    useEffect(() => {
        doFetch(search, filter, sortKey, page);
        mountedRef.current = true;
    }, []); // eslint-disable-line

    /* ── khi page thay đổi (pagination click) ───────────────────── */
    useEffect(() => {
        if (!mountedRef.current) return;
        doFetch(search, filter, sortKey, page);
    }, [page]); // eslint-disable-line

    /* ── sort thay đổi → reset về trang 0 rồi fetch ─────────────── */
    const handleSortChange = e => {
        const newKey = e.target.value;
        setSortKey(newKey);
        setPage(0);
        doFetch(search, filter, newKey, 0);
    };

    /* ── Tìm kiếm button ─────────────────────────────────────────── */
    const handleSearch = () => {
        setPage(0);
        doFetch(search, filter, sortKey, 0);
    };

    /* ── Áp dụng bộ lọc ─────────────────────────────────────────── */
    const handleApplyFilter = newFilter => {
        setFilter(newFilter);
        setPage(0);
        doFetch(search, newFilter, sortKey, 0);
    };

    /* ── Xóa tất cả ─────────────────────────────────────────────── */
    const handleClearAll = () => {
        const s = { ...DEFAULT_SEARCH };
        const f = { ...DEFAULT_FILTER };
        setSearch(s); setFilter(f); setSortKey(""); setPage(0);
        doFetch(s, f, "", 0);
    };

    const activeSortLabel = SORT_OPTIONS[parseInt(sortKey)]?.label || "Mặc định";

    return (
        <div className="sp-page">
            {/* Breadcrumb */}
            <div className="sp-breadcrumb">
                <span className="sp-bc-link" onClick={() => navigate("/")}>Trang chủ</span>
                <span className="sp-bc-sep"> &gt; </span>
                <span>Không gian</span>
            </div>

            <div className="sp-container">
                <h1 className="sp-title">Tìm kiếm</h1>

                {/* ── SEARCH BAR ── */}
                <div className="sp-searchbar">
                    <div className="sp-sgroup">
                        <label>Ngày</label>
                        <div className="sp-iw">
                            <i className="fa-regular fa-calendar sp-ii"></i>
                            <input type="date" className="sp-input has-icon"
                                   min={(() => {
                                       const today = new Date();const yyyy = today.getFullYear();const mm = String(today.getMonth() + 1).padStart(2, '0');
                                       const dd = String(today.getDate()).padStart(2, '0');
                                       return `${yyyy}-${mm}-${dd}`;})()}
                                   value={search.date}
                                   onChange={e => setSearch(s => ({ ...s, date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="sp-sgroup">
                        <label>Thời gian</label>
                        <div className="sp-iw">
                            <i className="fa-regular fa-clock sp-ii"></i>
                            <select className="sp-input sp-sel has-icon"
                                    value={search.time}
                                    onChange={e => setSearch(s => ({ ...s, time: e.target.value }))}>
                                <option value="">Chọn thời gian</option>
                                {TIME_RANGES.map(t => (
                                    <option key={t} value={t}>{t.replace("-", " – ")}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="sp-sgroup">
                        <label>Số người</label>
                        <div className="sp-iw">
                            <i className="fa-solid fa-user-group sp-ii"></i>
                            <select className="sp-input sp-sel has-icon"
                                    value={search.capacity}
                                    onChange={e => setSearch(s => ({ ...s, capacity: e.target.value }))}>
                                <option value="">Tất cả</option>
                                {[1,2,4,6,10].map(n => (
                                    <option key={n} value={n}>{n < 10 ? `0${n}` : n} người</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="sp-btn-search" onClick={handleSearch}>
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                </div>

                {errorMsg && <div className="sp-error">⚠️ {errorMsg}</div>}

                {/* ── FILTER + CLEAR BAR ── */}
                <div className="sp-toolbar">
                    <button className="sp-btn-filter" onClick={() => setShowFilter(true)}>
                        <i className="fa-solid fa-sliders"></i> Bộ lọc
                    </button>
                    <button className="sp-btn-clear" onClick={handleClearAll}>Xóa bộ lọc</button>
                </div>

                {/* ── RESULT BAR (label + sort) ── */}
                <div className="sp-result-bar">
                    <span className="sp-result-label">Các không gian phù hợp</span>
                    <div className="sp-sort-wrap">
                        <span className="sp-sort-lbl">Sắp xếp theo</span>
                        <select className="sp-sort-sel"
                                value={sortKey}
                                onChange={handleSortChange}>
                            {SORT_OPTIONS.map((o, i) => (
                                <option key={i} value={i}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── ROOM LIST ── */}
                <div className="sp-list">
                    {loading ? (
                        <div className="sp-state"><i className="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>
                    ) : rooms.length === 0 ? (
                        <div className="sp-state">Không tìm thấy phòng phù hợp.</div>
                    ) : rooms.map(room => (
                        <RoomCard key={room.roomId} room={room}
                                  onDetail={id => navigate(`/spaces/${id}`)} />
                    ))}
                </div>

                <Pagination current={page} total={totalPages} onChange={p => setPage(p)} />
            </div>

            {showFilter && (
                <FilterModal
                    init={filter}
                    onApply={handleApplyFilter}
                    onClose={() => setShowFilter(false)} />
            )}
        </div>
    );
}