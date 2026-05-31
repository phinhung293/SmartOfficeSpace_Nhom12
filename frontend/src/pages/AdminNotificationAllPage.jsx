import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../api/notificationApi';
import './css/AdminNotificationAllPage.css';

const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Xác nhận đặt phòng' },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Nhắc thanh toán'    },
    REMINDER:     { icon: 'fa-clock',         color: '#f97316', label: 'Nhắc lịch'           },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Thông báo'           },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Hủy phòng'          },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Thông báo hệ thống' },
};

const STATUS_CONFIG = {
    SENT:      { label: 'Đã gửi',      className: 'status-sent'      },
    SCHEDULED: { label: 'Đã lên lịch', className: 'status-scheduled' },
    FAILED:    { label: 'Thất bại',    className: 'status-failed'    },
    UNREAD:    { label: 'Chưa đọc',    className: 'status-unread'    },
};

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusCfg(n) {
    if (n.status) return STATUS_CONFIG[n.status] || { label: n.status, className: 'status-sent' };
    if (!n.isRead) return STATUS_CONFIG.UNREAD;
    return STATUS_CONFIG.SENT;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const AdminNotificationAllPage = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [totalItems, setTotalItems]       = useState(0);

    const [search, setSearch]               = useState('');
    const [filterType, setFilterType]       = useState('');
    const [filterChannel, setFilterChannel] = useState('');
    const [dateFrom, setDateFrom]           = useState('');
    const [dateTo, setDateTo]               = useState('');

    const [page, setPage]         = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const dateFromRef = React.useRef(null);
    const dateToRef   = React.useRef(null);

    useEffect(() => { fetchData(); }, [page, pageSize]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await notificationApi.adminGetAll(page, pageSize);
            const data = res.data.data;
            if (data?.content) {
                setNotifications(data.content);
                setTotalItems(data.totalElements ?? data.content.length);
            } else if (Array.isArray(data)) {
                setNotifications(data);
                setTotalItems(data.length);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        navigate(`/admin/notifications/search?keyword=${encodeURIComponent(search)}&type=${encodeURIComponent(filterType)}&channel=${encodeURIComponent(filterChannel)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`);
    };
    const [pickingDate, setPickingDate] = useState('from');
    const filtered = notifications.filter(n => {
        const matchType    = !filterType    || n.type === filterType;
        const matchChannel = !filterChannel || (n.channel || 'Email') === filterChannel;
        const matchSearch  = !search
            || (n.message || '').toLowerCase().includes(search.toLowerCase())
            || (n.notifyId || '').toString().includes(search);
        return matchType && matchChannel && matchSearch;
    });


    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    const renderPageButtons = () => {
        const pages = [];
        const displayPages = Math.max(4, totalPages);
        const maxVisible = 4;
        let start = Math.max(0, page - 1);
        let end = Math.min(displayPages - 1, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    className={`anall-page-btn ${i === page ? 'active' : ''}`}
                    onClick={() => setPage(i)}
                >
                    {i + 1}
                </button>
            );
        }
        return pages;
    };


    return (
        <div className="anall-wrapper">
            {/* Breadcrumb */}
            <div className="anall-breadcrumb">
                <span onClick={() => navigate('/admin')} className="anall-bc-link">Trang chủ</span>
                <i className="fa-solid fa-chevron-right anall-bc-sep"></i>
                <span onClick={() => navigate('/admin/notifications')} className="anall-bc-link">Thông báo & Vận hành</span>
                <i className="fa-solid fa-chevron-right anall-bc-sep"></i>
                <span className="anall-bc-current">Quản lý thông báo</span>
            </div>

            <h1 className="anall-title">Quản lý thông báo</h1>
            <p className="anall-subtitle">Quản lý tất cả thông báo đã gửi trong hệ thống</p>

            {/* Filter */}
            <div className="anall-filter-card">
                <div className="anall-filter-row">
                    <div className="anall-filter-group">
                        <label>Notification</label>
                        <input type="text" placeholder="Nhập mã thông báo" value={search}
                               onChange={e => setSearch(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    </div>
                    <div className="anall-filter-group">
                        <label>Loại thông báo</label>
                        <input type="text" placeholder="Nhập tiêu đề" value={filterType}
                               onChange={e => setFilterType(e.target.value)} />
                    </div>
                    <div className="anall-filter-group">
                        <label>Kênh gửi</label>
                        <div className="anall-select-wrap">
                            <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
                                <option value="">Tất cả</option>
                                <option value="Email">Email</option>
                                <option value="SMS">SMS</option>
                                <option value="Push">Push</option>
                            </select>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>
                    <div className="anall-filter-group">
                        <label>Ngày gửi</label>
                        <div className="anall-date-range">
                            <input
                                type="text"
                                placeholder="Chọn ngày"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />

                            {/* Input date ẩn */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    ref={dateFromRef}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '0',
                                        opacity: 0,
                                        width: '0',
                                        height: '0',
                                        pointerEvents: 'none'
                                    }}
                                    onChange={e => setDateFrom(e.target.value)}
                                />
                                <input
                                    type="date"
                                    ref={dateToRef}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '0',
                                        opacity: 0,
                                        width: '0',
                                        height: '0',
                                        pointerEvents: 'none'
                                    }}
                                    onChange={e => setDateTo(e.target.value)}
                                />
                                <i
                                    className="fa-regular fa-calendar"
                                    style={{ cursor: 'pointer', color: '#9ca3af' }}
                                    onClick={() => {
                                        if (pickingDate === 'from') {
                                            dateFromRef.current?.showPicker();
                                            setPickingDate('to');
                                        } else {
                                            dateToRef.current?.showPicker();
                                            setPickingDate('from');
                                        }
                                    }}
                                ></i>
                            </div>
                        </div>
                    </div>
                    <button className="anall-search-btn" onClick={handleSearch}>
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="anall-table-card">
                {loading ? (
                    <div className="anall-loading">
                        <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                    </div>
                ) : (
                    <table className="anall-table">
                        <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Loại</th>
                            <th>Đối tượng</th>
                            <th>Kênh gửi</th>
                            <th>Ngày gửi</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="anall-empty">
                                    <i className="fa-regular fa-bell-slash"></i>
                                    <p>Không có thông báo nào</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(n => {
                                const cfg   = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                const stCfg = getStatusCfg(n);
                                return (
                                    <tr key={n.notifyId}>
                                        <td>
                                            <div className="anall-title-cell">
                                                <div className="anall-icon" style={{ background: cfg.color + '18' }}>
                                                    <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                                                </div>
                                                <div>
                                                    <p className="anall-msg-main">{cfg.label}</p>
                                                    <p className="anall-msg-sub">{n.message}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{cfg.label}</td>
                                        <td>{n.userName || '—'}</td>
                                        <td>{n.channel || 'Email'}</td>
                                        <td className="anall-date-cell">{formatDateTime(n.createdAt)}</td>
                                        <td>
                                                <span className={`anall-status ${stCfg.className}`}>
                                                    {stCfg.label}
                                                </span>
                                        </td>
                                        <td>
                                            <button className="anall-detail-btn"
                                                    onClick={() => navigate(`/admin/notifications/${n.notifyId}`)}>
                                                <i className="fa-regular fa-file-lines"></i> Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                <div className="anall-pagination">
                    <span className="anall-page-info">
                        Hiện thị {page * pageSize + 1} đến {Math.min((page + 1) * pageSize, totalItems)} của {totalItems} giao dịch
                    </span>
                    <div className="anall-page-controls">
                        <button className="anall-page-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
                        {renderPageButtons()}
                        <button className="anall-page-btn" onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
                        <div className="anall-page-size-wrap">
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
                                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/trang</option>)}
                            </select>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationAllPage;