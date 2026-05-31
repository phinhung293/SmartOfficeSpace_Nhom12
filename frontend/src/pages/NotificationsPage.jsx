import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import notificationApi from '../api/notificationApi';
import './css/NotificationsPage.css';

const TYPE_CONFIG = {
    BOOKING:   { icon: 'fa-circle-check', color: '#22c55e', label: 'Đặt phòng thành công' },
    PAYMENT:   { icon: 'fa-credit-card',  color: '#3b82f6', label: 'Thanh toán thành công' },
    REMINDER:  { icon: 'fa-bell',         color: '#f97316', label: 'Nhắc lịch đặt phòng' },
    PROMOTION: { icon: 'fa-tag',          color: '#a855f7', label: 'Ưu đãi mới dành cho bạn!!!' },
    SYSTEM:    { icon: 'fa-circle-info',  color: '#6b7280', label: 'Cập nhật chính sách' },
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const res = await notificationApi.getAll();
            setNotifications(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                        <div className="notif-page-empty">Bạn chưa có thông báo nào.</div>
                    ) : (
                        notifications.map(n => {
                            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                            return (
                                <div
                                    key={n.notifyId}
                                    className="notif-page-item"
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
                                            onClick={(e) => { e.stopPropagation(); handleViewDetail(e, n); }}
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
                        })
                    )}
                </div>
            </div>

        </>
    );
};

export default NotificationsPage;