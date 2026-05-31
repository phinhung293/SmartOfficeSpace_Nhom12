import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../api/notificationApi';
import './css/AdminNotificationPage.css';

const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Đặt phòng'  },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Thanh toán' },
    REMINDER:     { icon: 'fa-bell',          color: '#f97316', label: 'Nhắc lịch'  },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Khuyến mãi' },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Hủy phòng'  },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Hệ thống'   },
};

function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

const AdminNotificationPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const res = await notificationApi.adminGetSummary();
            setSummary(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = (summary?.recentNotifications || []).filter(n => {
        const matchType   = filterType === 'ALL' || n.type === filterType;
        const matchSearch = !search ||
            n.message.toLowerCase().includes(search.toLowerCase()) ||
            (n.userName || '').toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading) return (
        <div className="anp-loading">
            <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
        </div>
    );

    return (
        <div className="anp-wrapper">
            {/* Breadcrumb */}
            <div className="anp-breadcrumb">
                <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer', color: '#6b7280' }}>
                    Trang chủ
                </span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#9ca3af' }}></i>
                <span style={{ color: '#6b7280' }}>Thông báo & Vận hành</span>
            </div>

            {/* Header */}
            <div className="anp-header">
                <div>
                    <h1 className="anp-title">Tổng quan thông báo & Vận hành</h1>
                    <p className="anp-subtitle">Quản lý hệ thống thông báo và các hoạt động của người dùng</p>
                </div>
                <div className="anp-header-actions">
                    <button className="anp-search-btn">
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Thẻ số liệu */}
            <div className="anp-stats-grid">
                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#eff6ff' }}>
                        <i className="fa-solid fa-envelope" style={{ color: '#3b82f6' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Tổng thông báo đã gửi</p>
                        <h3 className="anp-stat-value">{summary?.totalNotifications ?? 0}</h3>
                    </div>
                </div>

                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#fef3c7' }}>
                        <i className="fa-solid fa-bell" style={{ color: '#f59e0b' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Thông báo chưa đọc</p>
                        <h3 className="anp-stat-value">{summary?.unreadCount ?? 0}</h3>
                    </div>
                </div>

                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#f0fdf4' }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Đặt phòng</p>
                        <h3 className="anp-stat-value">{summary?.bookingCount ?? 0}</h3>
                    </div>
                </div>

                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#eff6ff' }}>
                        <i className="fa-solid fa-credit-card" style={{ color: '#3b82f6' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Thanh toán</p>
                        <h3 className="anp-stat-value">{summary?.paymentCount ?? 0}</h3>
                    </div>
                </div>

                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#fef2f2' }}>
                        <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Hủy phòng</p>
                        <h3 className="anp-stat-value">{summary?.cancellationCount ?? 0}</h3>
                    </div>
                </div>

                <div className="anp-stat-card">
                    <div className="anp-stat-icon" style={{ background: '#f0f9ff' }}>
                        <i className="fa-solid fa-calendar-day" style={{ color: '#0ea5e9' }}></i>
                    </div>
                    <div>
                        <p className="anp-stat-label">Thông báo hôm nay</p>
                        <h3 className="anp-stat-value">{summary?.todayCount ?? 0}</h3>
                    </div>
                </div>
            </div>

            {/* Layout 2 cột */}
            <div className="anp-bottom-grid">

                {/* CỘT TRÁI: Thông báo gần đây */}
                <div className="anp-table-card">
                    <div className="anp-table-header">
                        <h2 className="anp-table-title">Thông báo gần đây</h2>
                        <span
                            className="anp-view-all-link"
                            onClick={() => navigate('/admin/notifications/all')}
                        >
                             Xem tất cả thông báo
                         </span>
                    </div>
                    <table className="anp-table">
                        <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Loại</th>
                            <th>Đối tượng</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="anp-empty">
                                    <i className="fa-regular fa-bell-slash"></i>
                                    <p>Không có thông báo nào</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <tr key={n.notifyId}>
                                        <td>
                                            <div className="anp-msg-cell">
                                                <div className="anp-msg-icon" style={{ background: cfg.color + '18' }}>
                                                    <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                                                </div>
                                                <span>{n.message}</span>
                                            </div>
                                        </td>
                                        <td>
                                    <span className="anp-type-badge"
                                          style={{ background: cfg.color + '18', color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                        </td>
                                        <td>
                                            <div className="anp-user-cell">
                                                <i className="fa-solid fa-user"></i>
                                                <div>
                                                    <p>{n.userName || '—'}</p>
                                                    <span>{n.userEmail || ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="anp-time-cell">{formatDateTime(n.createdAt)}</td>
                                        <td>
                                    <span className={`anp-status-badge ${n.isRead ? 'read' : 'unread'}`}>
                                        {n.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                    </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* CỘT PHẢI: Thông báo hôm nay */}
                <div className="anp-today-card">
                    <div className="anp-today-header">
                        <h2 className="anp-table-title">Thông báo hôm nay</h2>
                        <span className="anp-today-date">
                {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
                    </div>

                    <div className="anp-today-list">
                        {(summary?.todayNotifications || []).length === 0 ? (
                            <div className="anp-empty">
                                <i className="fa-regular fa-bell-slash"></i>
                                <p>Chưa có thông báo hôm nay</p>
                            </div>
                        ) : (
                            (summary?.todayNotifications || []).map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                                return (
                                    <div key={n.notifyId} className="anp-today-item">
                                        <div className="anp-msg-icon" style={{ background: cfg.color + '18' }}>
                                            <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                                        </div>
                                        <div className="anp-today-content">
                                            <div className="anp-today-meta">
                                    <span className="anp-type-badge"
                                          style={{ background: cfg.color + '18', color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                                <span className="anp-today-time">
                                        {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                            </div>
                                            <p className="anp-today-msg">{n.message}</p>
                                            {n.userName && (
                                                <span className="anp-today-user">
                                        <i className="fa-solid fa-user" style={{ fontSize: 10 }}></i> {n.userName}
                                    </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificationPage;