import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../api/notificationApi';
import './css/AdminNotificationAllPage.css';
import './css/AdminNotificationSearchPage.css';

const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Xác nhận đặt phòng' },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Nhắc thanh toán'    },
    REMINDER:     { icon: 'fa-clock',         color: '#f97316', label: 'Nhắc lịch'           },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Thông báo'           },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Hủy phòng'          },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Thông báo hệ thống' },
};

const PAGE_SIZE_OPTIONS = [10];

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function parseNotiId(val) {
    if (!val) return null;
    const stripped = val.replace(/^NOTI0*/i, '');
    const n = parseInt(stripped, 10);
    return isNaN(n) ? null : n;
}

function applyFilters(list, { notiId, keyword, userName, filterType, dateFrom }) {
    let result = [...list];

    if (notiId) {
        const targetId = parseNotiId(notiId);
        if (targetId !== null) {
            result = result.filter(n => n.notifyId === targetId);
        } else {
            const q = notiId.replace(/^NOTI0*/i, '').toLowerCase();
            result = result.filter(n => String(n.notifyId).includes(q));
        }
    }

    if (keyword) {
        const q = keyword.toLowerCase();
        result = result.filter(n =>
            (n.message || '').toLowerCase().includes(q) ||
            (TYPE_CONFIG[n.type]?.label || '').toLowerCase().includes(q)
        );
    }

    if (userName) {
        const q = userName.toLowerCase();
        result = result.filter(n => (n.userName || '').toLowerCase().includes(q));
    }

    if (filterType) {
        result = result.filter(n => n.type === filterType);
    }

    if (dateFrom) {
        result = result.filter(n => {
            if (!n.createdAt) return false;
            return n.createdAt.slice(0, 10) === dateFrom;
        });
    }

    return result;
}

const AdminNotificationSearchPage = () => {
    const navigate = useNavigate();

    // ── Filter state ─────────────────────────────────────────────────────────
    const [notiId,     setNotiId]     = useState('');
    const [keyword,    setKeyword]    = useState('');
    const [userName,   setUserName]   = useState('');
    const [filterType, setFilterType] = useState('');
    const [dateFrom,   setDateFrom]   = useState('');

    // ── Data state ───────────────────────────────────────────────────────────
    const [allData,   setAllData]   = useState([]);
    const [filtered,  setFiltered]  = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [page,      setPage]      = useState(0);
    const [pageSize,  setPageSize]  = useState(10);
    const [sortOrder, setSortOrder] = useState('Mới nhất');

    const dateRef = useRef(null);

    // ── Load toàn bộ data một lần khi mount ──────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const res = await notificationApi.adminGetAll(0, 9999);
                const data = res.data.data;
                const list = data?.content ?? (Array.isArray(data) ? data : []);
                setAllData(list);
                setFiltered(list);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Lọc real-time mỗi khi filter thay đổi ────────────────────────────────
    useEffect(() => {
        setPage(0);
        const result = applyFilters(allData, { notiId, keyword, userName, filterType, dateFrom });
        const sorted = [...result].sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'Mới nhất' ? tb - ta : ta - tb;
        });
        setFiltered(sorted);
    }, [notiId, keyword, userName, filterType, dateFrom, sortOrder, allData]);

    // ── Nút Làm mới ──────────────────────────────────────────────────────────
    const handleReset = () => {
        setNotiId(''); setKeyword(''); setUserName('');
        setFilterType(''); setDateFrom(''); setPage(0);
    };

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const paginated  = filtered.slice(page * pageSize, (page + 1) * pageSize);

    const displayPages = Math.max(4, totalPages);
    const renderPageButtons = () => {
        const pages = [];
        const maxVisible = 4;
        let start = Math.max(0, page - 1);
        let end   = Math.min(displayPages - 1, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);
        for (let i = start; i <= end; i++) {
            pages.push(
                <button key={i}
                        className={`anall-page-btn ${i === page ? 'active' : ''}`}
                        onClick={() => setPage(i)}>
                    {i + 1}
                </button>
            );
        }
        return pages;
    };

    const hasFilter = notiId || keyword || userName || filterType || dateFrom;

    return (
        <div className="anall-wrapper">
            {/* Breadcrumb */}
            <div className="anall-breadcrumb">
                <span onClick={() => navigate('/admin')} className="anall-bc-link">Trang chủ</span>
                <i className="fa-solid fa-chevron-right anall-bc-sep"></i>
                <span onClick={() => navigate('/admin/notifications')} className="anall-bc-link">Thông báo & Vận hành</span>
                <i className="fa-solid fa-chevron-right anall-bc-sep"></i>
                <span className="anall-bc-current">Tìm kiếm</span>
            </div>

            {/* Filter card */}
            <div className="ansearch-filter-card">
                <div className="ansearch-filter-row">

                    <div className="ansearch-filter-group">
                        <label>Notification</label>
                        <input
                            type="text"
                            placeholder="Nhập mã thông báo"
                            value={notiId}
                            onChange={e => setNotiId(e.target.value)}
                        />
                    </div>

                    <div className="ansearch-filter-group">
                        <label>Tiêu đề</label>
                        <input
                            type="text"
                            placeholder="Nhập tiêu đề"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                        />
                    </div>

                    <div className="ansearch-filter-group">
                        <label>Tên khách hàng</label>
                        <input
                            type="text"
                            placeholder="Nhập tên khách hàng"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                        />
                    </div>

                    <div className="ansearch-filter-group">
                        <label>Loại thông báo</label>
                        <div className="anall-select-wrap">
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                style={{ color: filterType === '' ? '#9ca3af' : '#374151', height: 40 }}
                            >
                                <option value="">Tất cả</option>
                                <option value="BOOKING">Đặt phòng</option>
                                <option value="PAYMENT">Thanh toán</option>
                                <option value="CANCELLATION">Hủy phòng</option>
                                <option value="REMINDER">Nhắc lịch</option>
                                <option value="SYSTEM">Hệ thống</option>
                                <option value="PROMOTION">Khuyến mãi</option>
                            </select>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>

                    <div className="ansearch-filter-group">
                        <label>Ngày tạo</label>
                        <div className="anall-date-range">
                            <input
                                type="text"
                                placeholder="Chọn ngày"
                                value={dateFrom}
                                readOnly
                                style={{ cursor: 'pointer' }}
                                onClick={() => dateRef.current?.showPicker()}
                            />
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    ref={dateRef}
                                    style={{ position: 'absolute', bottom: '-4px', right: 0, opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                                    onChange={e => setDateFrom(e.target.value)}
                                />
                                <i className="fa-regular fa-calendar"
                                   style={{ cursor: 'pointer', color: '#9ca3af' }}
                                   onClick={() => dateRef.current?.showPicker()}
                                ></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ansearch-btn-row">
                    <button className="anall-search-btn" onClick={() => {}}>
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                    <button className="ansearch-reset-btn" onClick={handleReset}>
                        <i className="fa-solid fa-rotate-right"></i> Làm mới
                    </button>
                </div>
            </div>

            {/* Bảng kết quả */}
            <div className="anall-table-card">
                <div className="ansearch-result-header">
                    <div>
                        <h2 className="ansearch-result-title">Kết quả tìm kiếm</h2>
                        <p className="ansearch-result-count">
                            {hasFilter
                                ? `Tìm thấy ${filtered.length} thông báo`
                                : `Hiển thị tất cả ${filtered.length} thông báo`}
                        </p>
                    </div>
                    <div className="anall-select-wrap">
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                                style={{ width: 160, height: 40, borderRadius: 8, border: '1.5px solid #e5e7eb' }}>
                            <option>Mới nhất</option>
                            <option>Cũ nhất</option>
                        </select>
                        <i className="fa-solid fa-chevron-down"></i>
                    </div>
                </div>

                {loading ? (
                    <div className="anall-loading">
                        <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                    </div>
                ) : (
                    <table className="anall-table">
                        <thead>
                        <tr>
                            <th>NOTIFICATION ID</th>
                            <th>TIÊU ĐỀ</th>
                            <th>NGƯỜI NHẬN</th>
                            <th>LOẠI</th>
                            <th>TRẠNG THÁI</th>
                            <th>NGÀY TẠO</th>
                            <th>TỔNG TIỀN</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="anall-empty">
                                    <i className="fa-regular fa-bell-slash"></i>
                                    <p>{hasFilter ? 'Không tìm thấy kết quả phù hợp' : 'Không có thông báo nào'}</p>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <tr key={n.notifyId}>
                                        <td>
                                            <span className="ansearch-noti-id"
                                                  onClick={() => navigate(`/admin/notifications/${n.notifyId}`)}>
                                                NOTI{String(n.notifyId).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                <i className={`fa-solid ${cfg.icon}`}
                                                   style={{ color: cfg.color, fontSize: 14, marginTop: 2 }}></i>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                                        {cfg.label}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                                        {n.message}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{n.userName || '—'}</td>
                                        <td>
                                            <span style={{
                                                background: cfg.color + '20', color: cfg.color,
                                                padding: '3px 10px', borderRadius: 20,
                                                fontSize: 12, fontWeight: 600
                                            }}>
                                                {n.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ansearch-status ${n.isRead ? 'confirmed' : 'pending'}`}>
                                                ● {n.isRead ? 'Đã gửi' : 'Chưa đọc'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{formatDateTime(n.createdAt)}</td>
                                        <td style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', whiteSpace: 'nowrap' }}>
                                            {n.totalAmount != null
                                                ? n.totalAmount.toLocaleString('vi-VN') + 'đ'
                                                : '—'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                )}

                {/* Pagination — lấy từ code1, dùng pageSize state */}
                <div className="anall-pagination">
                    <span className="anall-page-info">
                        Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filtered.length)} trong số {filtered.length} thông báo
                    </span>
                    <div className="anall-page-controls">
                        <button className="ansearch-nav-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
                        <button className="ansearch-nav-btn" onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>‹</button>
                        {renderPageButtons()}
                        <button className="ansearch-nav-btn" onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page >= totalPages - 1}>›</button>
                        <button className="ansearch-nav-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
                        <div style={{ marginLeft: 8, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                                style={{ height: 36, borderRadius: 8, border: '1.5px solid #e5e7eb', padding: '0 28px 0 10px', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                            >
                                {PAGE_SIZE_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}/trang</option>
                                ))}
                            </select>
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: 11, position: 'absolute', right: 9, pointerEvents: 'none', color: '#6b7280' }}></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationSearchPage;