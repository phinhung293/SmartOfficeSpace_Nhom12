import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import notificationApi from '../api/notificationApi';
import './css/NotificationsPage.css';

// FIX #5: Thêm CANCELLATION, sửa label PROMOTION cho chuyên nghiệp hơn
const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Đặt phòng thành công' },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Thanh toán thành công' },
    REMINDER:     { icon: 'fa-bell',          color: '#f97316', label: 'Nhắc lịch đặt phòng' },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Ưu đãi dành cho bạn' },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Đơn đặt phòng đã hủy' },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Thông báo hệ thống' },
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

// FIX #7: Thêm phân trang — số lượng thông báo mỗi trang
const PAGE_SIZE = 10;

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    // FIX #7: State phân trang
    const [page, setPage]           = useState(0);
    const [hasMore, setHasMore]     = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAll(0, true);
    }, []);

    // FIX #7: fetchAll hỗ trợ phân trang — reset=true khi load lần đầu
    const fetchAll = async (pageNum = 0, reset = false) => {
        try {
            reset ? setLoading(true) : setLoadingMore(true);
            const res = await notificationApi.getAll(pageNum, PAGE_SIZE);
            const data = res.data.data || [];
            setNotifications(prev => reset ? data : [...prev, ...data]);
            setPage(pageNum);
            setHasMore(data.length === PAGE_SIZE);
        } catch (err) {
            console.error(err);
        } finally {
            reset ? setLoading(false) : setLoadingMore(false);
        }
    };

    const handleMarkAllRead = async () => {
        await notificationApi.markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    };

    const handleClickItem = async (n) => {
        if (!n.isRead) {
            await notificationApi.markRead(n.notifyId);
            setNotifications(prev =>
                prev.map(x => x.notifyId === n.notifyId ? { ...x, isRead: 1 } : x)
            );
        }
    };

    const handleViewDetail = (e, n) => {
        e.stopPropagation();
        handleClickItem(n);
        navigate(`/notifications/${n.notifyId}`);
    };

    const hasUnread = notifications.some(n => !n.isRead);

    return (
        <>

            <div className="notif-page-wrapper">
                {/* Breadcrumb */}
                <div className="notif-breadcrumb">
                    <span onClick={() => navigate('/')}>Trang chủ</span>
                    <span> &gt; </span>
                    <span>Thông báo</span>
                </div>

                {/* Card */}
                <div className="notif-page-card">

                    <div className="notif-page-header">
                        <h2>Tất cả thông báo</h2>
                        {notifications.length > 0 && (
                            <button
                                className={`notif-page-markall ${!hasUnread ? 'markall-done' : ''}`}
                                onClick={handleMarkAllRead}
                                disabled={!hasUnread}
                            >
                                <i className="fa-regular fa-circle-check"></i> Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="notif-page-empty">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                        <div className="notif-page-empty">
                            <i className="fa-regular fa-bell-slash"
                               style={{ fontSize: 32, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
                            Bạn chưa có thông báo nào.
                        </div>
                    ) : (
                        <>
                            {notifications.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <div
                                        key={n.notifyId}
                                        className={`notif-page-item ${!n.isRead ? 'unread' : ''}`}
                                        onClick={() => handleClickItem(n)}
                                    >
                                        {/* Icon */}
                                        <div className="notif-page-icon" style={{ background: cfg.color + '22' }}>
                                            <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                                        </div>

                                        {/* Nội dung */}
                                        <div className="notif-page-body">
                                            <p className="notif-page-label">{cfg.label}</p>
                                            <p className="notif-page-message">{n.message}</p>
                                            <button
                                                className="notif-page-btn"
                                                onClick={(e) => handleViewDetail(e, n)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>

                                        {/* Thời gian + chấm xanh */}
                                        <div className="notif-page-meta">
                                            <span className="notif-page-time">{timeAgo(n.createdAt)}</span>
                                            {!n.isRead && <span className="notif-page-dot-right"></span>}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* FIX #7: Nút xem thêm */}
                            {hasMore && (
                                <div className="notif-page-loadmore">
                                    <button
                                        className="notif-page-loadmore-btn"
                                        onClick={() => fetchAll(page + 1, false)}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore
                                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang tải...</>
                                            : 'Xem thêm thông báo'
                                        }
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationsPage;