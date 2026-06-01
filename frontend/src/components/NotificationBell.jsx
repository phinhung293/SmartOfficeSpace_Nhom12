import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../api/notificationApi';

const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Đặt phòng'  },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Thanh toán' },
    REMINDER:     { icon: 'fa-bell',          color: '#f97316', label: 'Nhắc lịch'  },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Khuyến mãi' },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Hủy phòng'  },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Hệ thống'   },
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

const NotificationBell = () => {
    const [open, setOpen]          = useState(false);
    const [notifications, setNoti] = useState([]);
    const [unread, setUnread]      = useState(0);
    const dropdownRef              = useRef(null);
    const navigate                 = useNavigate();

    const user    = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = isAdmin
                ? await notificationApi.adminGetUnreadCount()
                : await notificationApi.getUnreadCount();
            setUnread(res.data.data);
        } catch {}
    };

    const handleBellClick = async () => {
        if (!open) {
            try {
                const res = isAdmin
                    ? await notificationApi.adminGetAll(0, 8)
                    : await notificationApi.getAll();
                setNoti(res.data.data || []);
            } catch {}
        }
        setOpen(!open);
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        try {
            isAdmin
                ? await notificationApi.adminMarkAllRead()
                : await notificationApi.markAllRead();
            setUnread(0);
            setNoti(prev => prev.map(n => ({ ...n, isRead: 1 })));
        } catch {}
    };

    // FIX #6: Cả user và admin đều mark read + navigate khi click item
    const handleClickItem = async (n) => {
        setOpen(false);
        // Mark đã đọc nếu chưa đọc
        if (!n.isRead) {
            try {
                if (!isAdmin) {
                    await notificationApi.markRead(n.notifyId);
                }
                setUnread(prev => Math.max(0, prev - 1));
                setNoti(prev => prev.map(x =>
                    x.notifyId === n.notifyId ? { ...x, isRead: 1 } : x
                ));
            } catch {}
        }
        // Navigate đến trang chi tiết
        const path = isAdmin
            ? `/admin/notifications`   // Admin → trang quản lý
            : `/notifications/${n.notifyId}`;  // User → chi tiết thông báo
        navigate(path);
    };

    return (
        <div className="notification-bell-wrapper" ref={dropdownRef}>
            <div className="notification-bell" onClick={handleBellClick}>
                <i className="fa-regular fa-bell"></i>
                {unread > 0 && (
                    <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>
                )}
            </div>

            {open && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <span className="notif-title">
                            {isAdmin ? 'Thông báo hệ thống' : 'Thông báo'}
                        </span>
                        {unread > 0 && (
                            <button className="notif-mark-all" onClick={handleMarkAllRead}>
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                <i className="fa-regular fa-bell-slash"
                                   style={{ fontSize: 28, color: '#d1d5db', display: 'block', marginBottom: 8 }}></i>
                                Không có thông báo nào
                            </div>
                        ) : (
                            notifications.slice(0, 8).map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <div
                                        key={n.notifyId}
                                        className={`notif-item ${n.isRead ? '' : 'unread'}`}
                                        onClick={() => handleClickItem(n)}
                                    >
                                        <div className="notif-icon" style={{ background: cfg.color + '20' }}>
                                            <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                                        </div>
                                        <div className="notif-content">
                                            {isAdmin && (
                                                <div className="notif-admin-meta">
                                                    <span className="notif-type-badge"
                                                          style={{ background: cfg.color + '18', color: cfg.color }}>
                                                        {cfg.label}
                                                    </span>
                                                    {n.userName && (
                                                        <span className="notif-sender">
                                                            <i className="fa-solid fa-user" style={{ fontSize: 10 }}></i>
                                                            {n.userName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <p className="notif-message">{n.message}</p>
                                            <span className="notif-time">{timeAgo(n.createdAt)}</span>
                                        </div>
                                        {!n.isRead && <span className="notif-dot"></span>}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div
                        className="notif-footer"
                        onClick={() => {
                            setOpen(false);
                            navigate(isAdmin ? '/admin/notifications' : '/notifications');
                        }}
                    >
                        Xem tất cả thông báo <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;