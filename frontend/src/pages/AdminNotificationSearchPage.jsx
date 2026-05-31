import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const AdminNotificationSearchPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Đọc params từ URL để fill lại filter
    const [keyword,     setKeyword]     = useState(searchParams.get('keyword')  || '');
    const [filterType,  setFilterType]  = useState(searchParams.get('type')     || '');
    const [filterChannel, setFilterChannel] = useState(searchParams.get('channel') || '');
    const [dateFrom,    setDateFrom]    = useState(searchParams.get('dateFrom') || '');
    const [dateTo,      setDateTo]      = useState(searchParams.get('dateTo')   || '');

    const [results,    setResults]    = useState([]);
    const [total,      setTotal]      = useState(0);
    const [loading,    setLoading]    = useState(false);
    const [page,       setPage]       = useState(0);
    const [pageSize,   setPageSize]   = useState(10);
    const [sortOrder,  setSortOrder]  = useState('Mới nhất');

    const dateFromRef = React.useRef(null);
    const dateToRef   = React.useRef(null);
    const [pickingDate, setPickingDate] = useState('from');

    useEffect(() => {
        doSearch();
    }, [page, pageSize]);

    const doSearch = async () => {
        try {
            setLoading(true);
            const hasFilter = keyword || filterType || filterChannel || dateFrom || dateTo;
            let data;
            if (hasFilter) {
                const res = await notificationApi.adminSearch({
                    keyword, type: filterType, dateFrom, dateTo, page, size: pageSize
                });
                data = res.data.data;
            } else {
                const res = await notificationApi.adminGetAll(page, pageSize);
                data = res.data.data;
            }
            if (data?.content) {
                setResults(data.content);
                setTotal(data.totalElements ?? data.content.length);
            } else if (Array.isArray(data)) {
                setResults(data);
                setTotal(data.length);
            } else {
                setResults([]);
                setTotal(0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        setSearchParams({ keyword, type: filterType, channel: filterChannel, dateFrom, dateTo });
        doSearch();
    };

    const handleReset = () => {
        setKeyword(''); setFilterType(''); setFilterChannel('');
        setDateFrom(''); setDateTo(''); setPage(0);
        navigate('/admin/notifications/search');
    };

    const totalPages = Math.ceil(total / pageSize) || 1;
    const displayPages = Math.max(4, totalPages);
    const renderPageButtons = () => {
        const pages = [];
        const maxVisible = 4;
        let start = Math.max(0, page - 1);
        let end = Math.min(displayPages - 1, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);
        for (let i = start; i <= end; i++) {
            pages.push(
                <button key={i} className={`anall-page-btn ${i === page ? 'active' : ''}`}
                        onClick={() => setPage(i)}>{i + 1}</button>
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
                <span className="anall-bc-current">Tìm kiếm</span>
            </div>

            {/* Filter card */}
            <div className="ansearch-filter-card">
                <div className="ansearch-filter-row">
                    <div className="ansearch-filter-group">
                        <label>Notification</label>
                        <input type="text" placeholder="Nhập mã thông báo" value={keyword}
                               onChange={e => setKeyword(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    </div>
                    <div className="ansearch-filter-group">
                        <label>Tiêu đề</label>
                        <input type="text" placeholder="Nhập tiêu đề" value={filterType}
                               onChange={e => setFilterType(e.target.value)} />
                    </div>
                    <div className="ansearch-filter-group">
                        <label>Tên khách hàng</label>
                        <input type="text" placeholder="Nhập tên khách hàng" value={filterChannel}
                               onChange={e => setFilterChannel(e.target.value)} />
                    </div>
                    <div className="ansearch-filter-group">
                        <label>Trạng thái thanh toán</label>
                        <div className="anall-select-wrap">
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                    style={{ color: filterType === '' ? '#9ca3af' : '#374151', height: 40 }}>
                                <option value="">Tất cả</option>
                                <option value="BOOKING">Đặt phòng</option>
                                <option value="PAYMENT">Thanh toán</option>
                                <option value="CANCELLATION">Hủy phòng</option>
                                <option value="REMINDER">Nhắc lịch</option>
                                <option value="SYSTEM">Hệ thống</option>
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
                                onChange={e => setDateFrom(e.target.value)}
                            />
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
                </div>
                <div className="ansearch-btn-row">
                    <button className="anall-search-btn" onClick={handleSearch}>
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                    <button className="ansearch-reset-btn" onClick={handleReset}>
                        <i className="fa-solid fa-rotate-right"></i> Làm mới
                    </button>
                </div>
            </div>

            {/* Kết quả */}
            <div className="anall-table-card">
                <div className="ansearch-result-header">
                    <div>
                        <h2 className="ansearch-result-title">Kết quả tìm kiếm</h2>
                        <p className="ansearch-result-count">Tìm thấy {total} thông báo</p>
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
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="anall-empty">
                                    <i className="fa-regular fa-bell-slash"></i>
                                    <p>Không tìm thấy kết quả</p>
                                </td>
                            </tr>
                        ) : (
                            results.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <tr key={n.notifyId}>
                                        <td>
                                                <span className="ansearch-noti-id"
                                                      onClick={() => navigate(`/admin/notifications/${n.notifyId}`)}>
                                                    NOTI{String(n.notifyId).padStart(2, '0')}
                                                </span>
                                        </td>
                                        <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                            {cfg.label.split(' ').pop()}
                                        </td>
                                        <td>{n.userName || '—'}</td>
                                        <td>{n.type}</td>
                                        <td>
                                                <span className={`ansearch-status ${n.isRead ? 'confirmed' : 'pending'}`}>
                                                    ● {n.isRead ? 'Đã xác nhận' : 'Đang xử lý'}
                                                </span>
                                        </td>
                                        <td>{formatDateTime(n.createdAt)}</td>
                                        <td>—</td>
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
                        Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} trong số {total} đặt phòng
                    </span>
                    <div className="anall-page-controls">
                        <button className="ansearch-nav-btn" onClick={() => setPage(0)} disabled={page === 0}>Trước</button>
                        {renderPageButtons()}
                        <button className="ansearch-nav-btn" onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page >= totalPages - 1}>Tiếp</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationSearchPage;