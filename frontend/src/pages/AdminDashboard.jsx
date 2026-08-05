import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import './css/AdminDashboard.css';

import {
    adminGetAllBookings, adminCancelBooking, adminConfirmBooking, adminGetAllRooms
} from '../api/bookingApi';
import { getRevenueByMonth } from '../api/reportApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axiosInstance from '../api/axiosInstance';
import AdminPayment from './AdminPayment';
// Import thêm component quản lý người dùng từ nhánh develop
import UserManagement from './UserManagement';
import ReportPage from './ReportPage';
import './css/Report.css';

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

const formatVNDChart = (v) => {
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "T";
    if (v >= 1_000_000)     return (v / 1_000_000).toFixed(0) + "M";
    if (v >= 1_000)         return (v / 1_000).toFixed(0) + "K";
    return v;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a2e44" }}>{label}</div>
            <div style={{ color: "#3b82f6" }}>
                Doanh thu: {Number(payload[0].value).toLocaleString("vi-VN")} đ
            </div>
        </div>
    );
};
// ── Trạng thái booking ─────────────────────────────────────────────────────
const STATUS_MAP = {
    PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#b45309', bg: '#fef3c7' },
    CONFIRMED:       { label: 'Đã xác nhận',    color: '#1a7f3c', bg: '#dcfce7' },
    CANCELLED:       { label: 'Đã hủy',         color: '#ef4444', bg: '#fee2e2' },
    EXPIRED:         { label: 'Hết hạn',         color: '#94a3b8', bg: '#f1f5f9' },
};

// ── Trạng thái phòng ───────────────────────────────────────────────────────
const ROOM_STATUS_COLOR = {
    'Còn trống':       { color: '#1a7f3c', bg: '#dcfce7' },
    'Đang bận':        { color: '#2563eb', bg: '#dbeafe' },
    'Đang hoạt động':  { color: '#1a7f3c', bg: '#dcfce7' },
    'Ngừng hoạt động': { color: '#ef4444', bg: '#fee2e2' },
    'Bảo trì':         { color: '#b45309', bg: '#fef3c7' },
};

// ── Icon & màu theo type thông báo ─────────────────────────────────────────
const NOTIFY_TYPE_CONFIG = {
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Thanh toán' },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Hủy phòng'  },
    REMINDER:     { icon: 'fa-bell',          color: '#f97316', label: 'Nhắc lịch'  },
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Đặt phòng'  },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Hệ thống'   },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Khuyến mãi' },
};

const fmtTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('vi-VN');
};
const fmtDateTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {s.label}
        </span>
    );
};

const RoomStatusBadge = ({ status }) => {
    const s = ROOM_STATUS_COLOR[status] || { color: '#64748b', bg: '#f1f5f9' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {status}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [activeMenu, setActiveMenu] = useState('tong-quan');

    return (
        <div className="admin-main-body-layout">

            {/* ── SIDEBAR (Tích hợp đầy đủ menu từ cả 2 nhánh) ────────────────── */}
            <aside className="admin-sidebar">
                <ul className="sidebar-menu">

                    <li className={`menu-node ${activeMenu === 'tong-quan' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('tong-quan')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-house-chimney menu-icon"></i>
                            <span>Tổng quan</span>
                        </div>
                    </li>

                    {/* Khôi phục menu Quản lý người dùng của develop */}
                    <li className={`menu-node ${activeMenu === 'quan-ly-nguoi-dung' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('quan-ly-nguoi-dung')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-user-group menu-icon"></i>
                            <span>Quản lý người dùng</span>
                        </div>
                    </li>

                    <li className={`menu-node ${activeMenu === 'dieu-phoi' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('dieu-phoi')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-cubes menu-icon"></i>
                            <span>Quản lý không gian</span>
                        </div>
                    </li>

                    <li className={`menu-node ${activeMenu === 'lich-su' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('lich-su')}>
                        <div className="menu-link-item">
                            <i className="fa-regular fa-calendar-days menu-icon"></i>
                            <span>Quản lý đặt phòng</span>
                        </div>
                    </li>

                    <li className={`menu-node ${activeMenu === 'thanh-toan' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('thanh-toan')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-file-invoice-dollar menu-icon"></i>
                            <span>Thanh toán & Hóa đơn</span>
                        </div>
                    </li>

                    <li className={`menu-node ${activeMenu === 'thong-ke' ? 'active-node' : ''}`}
                        onClick={() => setActiveMenu('thong-ke')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-chart-line menu-icon"></i>
                            <span>Báo cáo thống kê</span>
                        </div>
                    </li>
                </ul>
            </aside>

            {/* ── MAIN CONTENT (Gộp đầy đủ view chức năng) ─────────────────── */}
            <main className="admin-main-content">
                {activeMenu === 'tong-quan' && <TongQuan onGoToLichSu={() => setActiveMenu('lich-su')} onGoToDieuPhoi={() => setActiveMenu('dieu-phoi')} />}

                {/* Khôi phục view component quản lý user của develop */}
                {activeMenu === 'quan-ly-nguoi-dung' && <UserManagement />}

                {activeMenu === 'lich-su'   && <AdminBookingManager />}
                {activeMenu === 'dieu-phoi' && <AdminSpaceCoordinator />}

                {/* Thanh toán & Hóa đơn */}
                {activeMenu === 'thanh-toan' && <AdminPayment />}

                {/*Thống kê*/}
                {activeMenu === 'thong-ke' && <ReportPage/>}
            </main>
        </div>
    );
};

export default AdminDashboard;

/* ══════════════════════════════════════════════════════════════
   TỔNG QUAN DASHBOARD — kết nối API thật từ nhánh booking
══════════════════════════════════════════════════════════════ */
function TongQuan({ onGoToLichSu, onGoToDieuPhoi }) {
    const [stats, setStats]               = useState(null);
    const [donHomNay, setDonHomNay]       = useState([]);
    const [phongHienTai, setPhongHienTai] = useState([]);
    const [notifSummary, setNotifSummary] = useState(null);   // ← MỚI
    const [activeTab, setActiveTab]       = useState('important'); // ← MỚI: 'important' | 'general'
    const [monthData, setMonthData]       = useState([]);

    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingDon, setLoadingDon]     = useState(true);
    const [loadingPhong, setLoadingPhong] = useState(true);
    const [loadingNotif, setLoadingNotif] = useState(true);   // ← MỚI
    const [loadingMonth, setLoadingMonth] = useState(true);

    useEffect(() => {
        axiosInstance.get('/admin/dashboard/tong-quan')
            .then(r => setStats(r.data.data))
            .catch(() => setStats({ tongNguoiDung: 0, donHomNay: 0, tongPhong: 0, doanhThuHomNay: 0 }))
            .finally(() => setLoadingStats(false));

        axiosInstance.get('/admin/dashboard/don-hom-nay', { params: { size: 5 } })
            .then(r => setDonHomNay(r.data.data?.content || []))
            .catch(() => setDonHomNay([]))
            .finally(() => setLoadingDon(false));

        axiosInstance.get('/admin/dashboard/tinh-trang-phong')
            .then(r => setPhongHienTai(r.data.data || []))
            .catch(() => setPhongHienTai([]))
            .finally(() => setLoadingPhong(false));

        // ── MỚI: Lấy summary thông báo ──────────────────────────────────
        axiosInstance.get('/admin/notifications/summary')
            .then(r => setNotifSummary(r.data.data))
            .catch(() => setNotifSummary(null))
            .finally(() => setLoadingNotif(false));

        const today = new Date().toISOString().split("T")[0];
        const monthsAgo = (n) => {
            const d = new Date();
            d.setMonth(d.getMonth() - n);
            return d.toISOString().split("T")[0];
        };
        getRevenueByMonth(monthsAgo(4), today)
            .then(r => {
                let data = r.data?.data?.details || [];
                if (data.length > 4) data = data.slice(-4);
                setMonthData(data);
            })
            .catch(() => setMonthData([]))
            .finally(() => setLoadingMonth(false));
    }, []);

    const doanhThu = stats?.doanhThuHomNay
        ? Number(stats.doanhThuHomNay).toLocaleString('vi-VN') + 'đ'
        : '0đ';

    // ── Danh sách hiển thị theo tab đang chọn ───────────────────────────
    const notifList = activeTab === 'important'
        ? (notifSummary?.importantNotifications || [])
        : (notifSummary?.generalNotifications   || []);

    // ── Số badge cho mỗi tab ────────────────────────────────────────────
    const importantCount = (notifSummary?.importantNotifications || []).filter(n => n.isRead === 0).length;
    const generalCount   = (notifSummary?.generalNotifications   || []).filter(n => n.isRead === 0).length;

    return (
        <div className="dashboard-view-container">
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon blue-bg"><i className="fa-solid fa-users"></i></div>
                    <div className="metric-info">
                        <p className="metric-label">Tổng người dùng</p>
                        <h3 className="metric-value">{loadingStats ? '…' : stats?.tongNguoiDung ?? 0}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon purple-bg"><i className="fa-solid fa-building"></i></div>
                    <div className="metric-info">
                        <p className="metric-label">Tổng số phòng</p>
                        <h3 className="metric-value">{loadingStats ? '…' : stats?.tongPhong ?? 0}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon lightblue-bg"><i className="fa-regular fa-calendar-check"></i></div>
                    <div className="metric-info">
                        <p className="metric-label">Đơn đặt hôm nay</p>
                        <h3 className="metric-value">{loadingStats ? '…' : stats?.donHomNay ?? 0}</h3>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon green-bg"><i className="fa-solid fa-dollar-sign"></i></div>
                    <div className="metric-info">
                        <p className="metric-label">Doanh thu hôm nay</p>
                        <h3 className="metric-value" style={{ fontSize: 16 }}>{loadingStats ? '…' : doanhThu}</h3>
                    </div>
                </div>
            </div>

            <div className="dashboard-row double-column">
                {/* ── CARD THÔNG BÁO (đã thay thế hardcode) ────────────────── */}
                <div className="dashboard-card card-half">
                    <div className="card-header-tabs">
                        {/* Tab Quan trọng */}
                        <button
                            className={`tab-btn ${activeTab === 'important' ? 'active' : ''}`}
                            onClick={() => setActiveTab('important')}
                            style={{ position: 'relative' }}
                        >
                            Quan trọng
                            {importantCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -8,
                                    background: '#ef4444', color: '#fff',
                                    borderRadius: '50%', fontSize: 10, fontWeight: 700,
                                    minWidth: 16, height: 16, lineHeight: '16px',
                                    textAlign: 'center', padding: '0 3px'
                                }}>
                                    {importantCount}
                                </span>
                            )}
                        </button>

                        {/* Tab Thông báo */}
                        <button
                            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                            style={{ position: 'relative' }}
                        >
                            Thông báo
                            {generalCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -8,
                                    background: '#3b82f6', color: '#fff',
                                    borderRadius: '50%', fontSize: 10, fontWeight: 700,
                                    minWidth: 16, height: 16, lineHeight: '16px',
                                    textAlign: 'center', padding: '0 3px'
                                }}>
                                    {generalCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="card-body-list">
                        {/* Loading */}
                        {loadingNotif && (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                            </div>
                        )}

                        {/* Không có dữ liệu */}
                        {!loadingNotif && notifList.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                                Không có thông báo nào
                            </div>
                        )}

                        {/* Danh sách thông báo */}
                        {!loadingNotif && notifList.slice(0, 5).map(n => {
                            const cfg = NOTIFY_TYPE_CONFIG[n.type] || NOTIFY_TYPE_CONFIG.SYSTEM;
                            return (
                                <div
                                    key={n.notifyId}
                                    className="list-item-notify"
                                    style={{ opacity: n.isRead === 1 ? 0.75 : 1 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <i
                                            className={`fa-solid ${cfg.icon}`}
                                            style={{ color: cfg.color, fontSize: 13, marginTop: 2, minWidth: 14 }}
                                        ></i>
                                        <div className="notify-title" style={{ flex: 1, fontWeight: 600, color: '#1e293b' }}>
                                            {n.message}
                                        </div>
                                    </div>
                                    <div className="notify-time" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {n.userName && (
                                            <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>
                                                {n.userName}
                                            </span>
                                        )}
                                        <span>{fmtDateTime(n.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}

                        <span
                            className="view-all-link"
                            onClick={() => window.location.href = '/admin/notifications'}
                            style={{ cursor: 'pointer' }}
                        >
                            &gt;&gt;Xem tất cả
                        </span>
                    </div>
                </div>

                <div className="dashboard-card card-half">
                    <div className="card-header-title">Tình trạng phòng hiện tại</div>
                    <div className="card-body-table">
                        {loadingPhong ? (
                            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                            </div>
                        ) : (
                            <table className="admin-dash-table">
                                <thead>
                                <tr>
                                    <th>Tên phòng</th>
                                    <th>Loại phòng</th>
                                    <th>Sức chứa</th>
                                    <th>Giá (VND/giờ)</th>
                                    <th>Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody>
                                {phongHienTai.slice(0, 6).map(room => (
                                    <tr key={room.roomId}>
                                        <td>{room.name}</td>
                                        <td>{room.workspaceType || '—'}</td>
                                        <td>{room.capacity} người</td>
                                        <td>{vnd(room.price)}</td>
                                        <td><RoomStatusBadge status={room.roomStatus} /></td>
                                    </tr>
                                ))}
                                {phongHienTai.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>Không có dữ liệu</td></tr>
                                )}
                                </tbody>
                            </table>
                        )}
                        <span className="view-all-link" onClick={onGoToDieuPhoi} style={{ cursor: 'pointer' }}>
                            &gt;&gt;Xem tất cả
                        </span>
                    </div>
                </div>
            </div>

            <div className="dashboard-row double-column" style={{ marginTop: 25 }}>
                <div className="dashboard-card card-half">
                    <div className="card-header-title">Đơn đặt phòng hôm nay</div>
                    <div className="card-body-table">
                        {loadingDon ? (
                            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                            </div>
                        ) : (
                            <table className="admin-dash-table">
                                <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Người dùng</th>
                                    <th>Phòng</th>
                                    <th>Thời gian</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody>
                                {donHomNay.map(b => (
                                    <tr key={b.bookingId}>
                                        <td style={{ color: '#003db5', fontWeight: 600 }}>{b.bookingCode}</td>
                                        <td>{b.userName}</td>
                                        <td>{b.roomName}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                                            {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                                        </td>
                                        <td>{vnd(b.totalAmount)}đ</td>
                                        <td><StatusBadge status={b.status} /></td>
                                    </tr>
                                ))}
                                {donHomNay.length === 0 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>Chưa có đơn hôm nay</td></tr>
                                )}
                                </tbody>
                            </table>
                        )}
                        <span className="view-all-link" onClick={onGoToLichSu} style={{ cursor: 'pointer' }}>
                            &gt;&gt;Xem tất cả
                        </span>
                    </div>
                </div>

                <div className="dashboard-card card-half">
                    <div className="card-header-title-row">
                        <div className="chart-title-left">
                            <span className="main-title-chart">THỐNG KÊ DOANH THU THEO THÁNG</span>
                            <span className="sub-title-chart">Doanh thu trong 4 tháng gần nhất</span>
                        </div>
                        <div className="chart-legend"><span className="legend-dot"></span> Doanh thu</div>
                    </div>
                    <div style={{ padding: '0 10px 10px 10px', height: 260 }}>
                        {loadingMonth ? (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
                            </div>
                        ) : monthData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: 13 }}>Không có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={formatVNDChart}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   LỊCH SỬ ĐẶT PHÒNG — Nhánh booking
══════════════════════════════════════════════════════════════ */
function AdminBookingManager() {
    const [bookings, setBookings]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [page, setPage]                   = useState(0);
    const [totalPages, setTotalPages]       = useState(0);
    const [totalItems, setTotalItems]       = useState(0);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast]                 = useState('');
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [editBooking, setEditBooking]     = useState(null);
    const [sameRoomBookings, setSameRoomBookings] = useState([]);

    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [dateFrom, setDateFrom]     = useState(firstOfMonth);
    const [dateTo, setDateTo]         = useState(today);
    const [roomFilter, setRoomFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(''), 3000);
    };

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: 10 };
            if (statusFilter) params.status = statusFilter;
            if (dateFrom)     params.dateFrom = dateFrom;
            if (dateTo)       params.dateTo   = dateTo;
            if (searchTerm)   params.bookingCode = searchTerm;
            if (roomFilter)   params.roomKeyword = roomFilter;
            const result = await adminGetAllBookings(params);
            setBookings(result.content || []);
            setTotalPages(result.totalPages || 0);
            setTotalItems(result.totalElements || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, dateFrom, dateTo, searchTerm, roomFilter]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleCancel = (id) => {
        setConfirmDialog({
            icon: '🗑️',
            title: 'Hủy đơn đặt phòng',
            message: 'Bạn có chắc chắn muốn hủy đơn này không? Hành động này không thể hoàn tác.',
            confirmLabel: 'Hủy đơn',
            confirmColor: '#ef4444',
            onConfirm: async () => {
                setConfirmDialog(null);
                setActionLoading(true);
                try {
                    await adminCancelBooking(id);
                    showToast('Đã hủy đơn thành công.');
                    setSelectedBooking(null);
                    fetchBookings();
                } catch (err) {
                    showToast(err.response?.data?.message || 'Hủy thất bại.', false);
                } finally { setActionLoading(false); }
            }
        });
    };

    const handleConfirm = async (id) => {
        setActionLoading(true);
        try {
            await adminConfirmBooking(id);
            showToast('Đã xác nhận thanh toán.');
            setSelectedBooking(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
            fetchBookings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Xác nhận thất bại.', false);
        } finally { setActionLoading(false); }
    };

    const handleRevertToPending = (id) => {
        setConfirmDialog({
            icon: '↩️',
            title: 'Hoàn về chờ thanh toán',
            message: 'Bạn có chắc chắn muốn chuyển đơn này về trạng thái "Chờ thanh toán"?',
            confirmLabel: 'Xác nhận',
            confirmColor: '#003db5',
            onConfirm: async () => {
                setConfirmDialog(null);
                setActionLoading(true);
                try {
                    await axiosInstance.put(`/admin/bookings/${id}/revert-pending`);
                    showToast('Đã chuyển về chờ thanh toán.');
                    setSelectedBooking(prev => prev ? { ...prev, status: 'PENDING_PAYMENT' } : null);
                    fetchBookings();
                } catch (err) {
                    showToast(err.response?.data?.message || 'Thao tác thất bại.', false);
                } finally { setActionLoading(false); }
            }
        });
    };

    const handleExportExcel = () => {
        if (bookings.length === 0) {
            showToast('Không có dữ liệu để xuất.', false);
            return;
        }

        const STATUS_VI = {
            CONFIRMED:       'Đã xác nhận',
            PENDING_PAYMENT: 'Chờ thanh toán',
            CANCELLED:       'Đã hủy',
            EXPIRED:         'Hết hạn',
        };

        const rows = bookings.map(b => ({
            'Mã đơn':      b.bookingCode,
            'Tên phòng':   b.roomName,
            'Khách hàng':  b.userName || '—',
            'Ngày đặt':    fmtDate(b.startTime),
            'Giờ bắt đầu': fmtTime(b.startTime),
            'Giờ kết thúc': fmtTime(b.endTime),
            'Tổng tiền (đ)': Number(b.totalAmount || 0),
            'Trạng thái':  STATUS_VI[b.status] || b.status,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const colWidths = Object.keys(rows[0]).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử đặt phòng');

        const fileName = `DatPhong_${dateFrom}_${dateTo}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showToast(`Đã xuất file ${fileName}`);
    };

    return (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: 80, right: 24,
                    background: toast.ok !== false ? '#1e293b' : '#ef4444',
                    color: '#fff', padding: '12px 20px', borderRadius: 8, zIndex: 9999, fontSize: 14
                }}>
                    {toast.msg}
                </div>
            )}

            {confirmDialog && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: '32px 28px 28px',
                        minWidth: 340, maxWidth: 400, width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>{confirmDialog.icon}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                            {confirmDialog.title}
                        </div>
                        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
                            {confirmDialog.message}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setConfirmDialog(null)}
                                    style={{
                                        flex: 1, padding: '11px 0', background: '#f1f5f9',
                                        color: '#475569', border: 'none', borderRadius: 10,
                                        fontWeight: 600, cursor: 'pointer', fontSize: 14
                                    }}>
                                Không, quay lại
                            </button>
                            <button onClick={confirmDialog.onConfirm}
                                    style={{
                                        flex: 1, padding: '11px 0',
                                        background: confirmDialog.confirmColor || '#003db5',
                                        color: '#fff', border: 'none', borderRadius: 10,
                                        fontWeight: 700, cursor: 'pointer', fontSize: 14
                                    }}>
                                {confirmDialog.confirmLabel || 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editBooking && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>Chỉnh sửa đơn đặt phòng</span>
                            <button onClick={() => { setEditBooking(null); setSameRoomBookings([]); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>

                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                            Mã đơn: <strong style={{ color: '#003db5' }}>{editBooking.bookingCode}</strong> — {editBooking.roomName}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày đặt</label>
                            <input type="date"
                                   value={editBooking.startTime ? editBooking.startTime.split('T')[0] : ''}
                                   onChange={e => {
                                       const date = e.target.value;
                                       const startHH = editBooking.startTime ? editBooking.startTime.split('T')[1]?.slice(0,5) : '09:00';
                                       const endHH   = editBooking.endTime   ? editBooking.endTime.split('T')[1]?.slice(0,5)   : '10:00';
                                       setEditBooking({ ...editBooking,
                                           startTime: date + 'T' + startHH + ':00',
                                           endTime:   date + 'T' + endHH   + ':00',
                                       });
                                   }}
                                   style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Giờ bắt đầu</label>
                                <select
                                    value={editBooking.startTime ? editBooking.startTime.split('T')[1]?.slice(0,5) : '08:00'}
                                    onChange={e => {
                                        const date = editBooking.startTime ? editBooking.startTime.split('T')[0] : '';
                                        setEditBooking({ ...editBooking, startTime: date + 'T' + e.target.value + ':00' });
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}>
                                    {Array.from({ length: 14 }, (_, i) => i + 8).map(h => {
                                        const hh = String(h).padStart(2, '0') + ':00';
                                        return <option key={h} value={hh}>{hh}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Giờ kết thúc</label>
                                <select
                                    value={editBooking.endTime ? editBooking.endTime.split('T')[1]?.slice(0,5) : '09:00'}
                                    onChange={e => {
                                        const date = editBooking.endTime ? editBooking.endTime.split('T')[0] : '';
                                        setEditBooking({ ...editBooking, endTime: date + 'T' + e.target.value + ':00' });
                                    }}
                                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}>
                                    {Array.from({ length: 14 }, (_, i) => i + 9).map(h => {
                                        const hh = String(h).padStart(2, '0') + ':00';
                                        return <option key={h} value={hh}>{hh}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 18 }}>
                            ⚠️ Chỉnh sửa thời gian có thể ảnh hưởng đến tính toán tổng tiền. Vui lòng kiểm tra lại với khách hàng.
                        </div>

                        {(() => {
                            const toISO = t => {
                                if (!t) return null;
                                if (Array.isArray(t)) {
                                    const [y, mo, d, h = 0, m = 0] = t;
                                    return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
                                }
                                return String(t);
                            };
                            const toH = t => {
                                const iso = toISO(t);
                                if (!iso) return 0;
                                const parts = iso.split('T')[1]?.split(':');
                                return parts ? parseInt(parts[0]) + parseInt(parts[1]) / 60 : 0;
                            };
                            const toHHMM = t => toISO(t)?.split('T')[1]?.slice(0,5) ?? '--:--';

                            const editStart = toH(editBooking.startTime);
                            const editEnd   = toH(editBooking.endTime);

                            const conflicts = sameRoomBookings.filter(b => {
                                const bStart = toH(b.startTime);
                                const bEnd   = toH(b.endTime);
                                return editStart < bEnd && editEnd > bStart;
                            });
                            const hasOverlap = conflicts.length > 0;
                            const COLORS = ['#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6'];

                            return (
                                <>
                                    {sameRoomBookings.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                                                📋 Đơn khác cùng phòng ngày này ({sameRoomBookings.length})
                                            </div>
                                            <div style={{ position: 'relative', height: 28, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                                                {sameRoomBookings.map((b, i) => {
                                                    const s = Math.max(toH(b.startTime), 8);
                                                    const e = Math.min(toH(b.endTime), 22);
                                                    const isConflict = conflicts.some(c => c.bookingId === b.bookingId);
                                                    return (
                                                        <div key={b.bookingId}
                                                             title={`${b.userName} — ${toHHMM(b.startTime)} → ${toHHMM(b.endTime)}`}
                                                             style={{
                                                                 position: 'absolute', top: 4, height: 20,
                                                                 left: ((s - 8) / 14 * 100) + '%',
                                                                 width: ((e - s) / 14 * 100) + '%',
                                                                 background: COLORS[i % COLORS.length],
                                                                 borderRadius: 4, opacity: 0.9,
                                                                 outline: isConflict ? '2px solid #dc2626' : 'none',
                                                             }}
                                                        />
                                                    );
                                                })}
                                                {(() => {
                                                    const s = Math.max(editStart, 8);
                                                    const e = Math.min(editEnd, 22);
                                                    return (
                                                        <div title={`Đơn đang sửa: ${toHHMM(editBooking.startTime)} → ${toHHMM(editBooking.endTime)}`}
                                                             style={{
                                                                 position: 'absolute', top: 4, height: 20,
                                                                 left: ((s - 8) / 14 * 100) + '%',
                                                                 width: ((e - s) / 14 * 100) + '%',
                                                                 background: hasOverlap ? '#dc2626' : '#003db5',
                                                                 borderRadius: 4, opacity: 0.9,
                                                                 border: `2px solid ${hasOverlap ? '#7f1d1d' : '#001f7a'}`,
                                                             }}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>
                                                {[8,10,12,14,16,18,20,22].map(h => <span key={h}>{String(h).padStart(2,'0')}:00</span>)}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background: hasOverlap ? '#dc2626' : '#003db5', border:`1.5px solid ${hasOverlap ? '#7f1d1d' : '#001f7a'}` }}></span>
                                                <span style={{ fontSize:11, color: hasOverlap ? '#dc2626' : '#003db5', fontWeight:700 }}>Đơn đang sửa</span>
                                                {sameRoomBookings.map((b, i) => (
                                                    <React.Fragment key={b.bookingId}>
                                                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:COLORS[i % COLORS.length] }}></span>
                                                        <span style={{ fontSize:11, color: conflicts.some(c=>c.bookingId===b.bookingId) ? '#dc2626' : '#64748b', fontWeight: conflicts.some(c=>c.bookingId===b.bookingId) ? 700 : 400 }}>
                                                            {b.userName} ({toHHMM(b.startTime)}–{toHHMM(b.endTime)})
                                                        </span>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {hasOverlap && (
                                        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', marginBottom: 14, fontWeight: 600 }}>
                                            🚫 Khung giờ {toHHMM(editBooking.startTime)}–{toHHMM(editBooking.endTime)} bị trùng với đơn của người khác. Không thể lưu.
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => { setEditBooking(null); setSameRoomBookings([]); }}
                                                style={{ flex: 1, padding: '10px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                            Hủy
                                        </button>
                                        <button
                                            disabled={hasOverlap || actionLoading}
                                            onClick={async () => {
                                                setActionLoading(true);
                                                try {
                                                    await axiosInstance.put(`/admin/bookings/${editBooking.bookingId}`, {
                                                        startTime: editBooking.startTime,
                                                        endTime: editBooking.endTime,
                                                    });
                                                    showToast('Đã cập nhật đơn thành công.');
                                                    setEditBooking(null);
                                                    setSameRoomBookings([]);
                                                    setSelectedBooking(null);
                                                    fetchBookings();
                                                } catch (err) {
                                                    showToast(err.response?.data?.message || 'Cập nhật thất bại.', false);
                                                } finally { setActionLoading(false); }
                                            }}
                                            style={{ flex: 2, padding: '10px', background: hasOverlap ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: hasOverlap ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                                            {hasOverlap ? '🚫 Bị trùng giờ' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Lịch sử đặt phòng</h3>
                        <button onClick={handleExportExcel}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                            <i className="fa-solid fa-file-arrow-down" style={{ color: '#16a34a' }}></i> Xuất Excel
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                            <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
                            <input type="date" value={dateFrom}
                                   onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                                   style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b' }} />
                            <span style={{ color: '#94a3b8' }}>–</span>
                            <input type="date" value={dateTo}
                                   onChange={e => { setDateTo(e.target.value); setPage(0); }}
                                   style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b' }} />
                        </div>

                        <select value={roomFilter}
                                onChange={e => { setRoomFilter(e.target.value); setPage(0); }}
                                style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 150, color: roomFilter ? '#1e293b' : '#94a3b8' }}>
                            <option value="">Tất cả không gian</option>
                            <option value="View City">Phòng họp View City</option>
                            <option value="Executive">Phòng họp Executive</option>
                            <option value="làm việc riêng">Phòng làm việc riêng</option>
                            <option value="chung">Bàn làm việc chung</option>
                        </select>

                        <select value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                                style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 160, color: statusFilter ? '#1e293b' : '#94a3b8' }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="CANCELLED">Đã hủy</option>
                            <option value="EXPIRED">Hết hạn</option>
                        </select>

                        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}></i>
                            <input
                                placeholder="Tìm mã đơn, khách hàng..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                                style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                                {['Mã đơn','Tên phòng','Khách hàng','Ngày đặt','Thời gian','Tổng tiền','Trạng thái','Thao tác'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {bookings.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Không có dữ liệu</td></tr>
                            ) : bookings.map(b => (
                                <tr key={b.bookingId}
                                    style={{ borderBottom: '1px solid #f1f5f9', background: selectedBooking?.bookingId === b.bookingId ? '#f0f7ff' : '' }}
                                    onMouseEnter={e => { if (selectedBooking?.bookingId !== b.bookingId) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={e => { if (selectedBooking?.bookingId !== b.bookingId) e.currentTarget.style.background = ''; }}
                                >
                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#003db5' }}>{b.bookingCode}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{b.roomName}</td>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{b.userName || '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>{fmtDate(b.startTime)}</td>
                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                        {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{vnd(b.totalAmount)}đ</td>
                                    <td style={{ padding: '12px 16px' }}><StatusBadge status={b.status} /></td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button
                                            onClick={() => setSelectedBooking(selectedBooking?.bookingId === b.bookingId ? null : b)}
                                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#64748b' }}
                                        >
                                            <i className="fa-regular fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                    <span>Hiện thị {bookings.length} trong tổng số {totalItems} đơn</span>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                                    style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-chevron-left" style={{ fontSize: 11 }}></i>
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                                <button key={i} onClick={() => setPage(i)}
                                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid', borderColor: i === page ? '#003db5' : '#e2e8f0', background: i === page ? '#003db5' : '#fff', color: i === page ? '#fff' : '#1e293b', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
                                    style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }}></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedBooking && (
                <div style={{ width: 340, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Chi tiết đơn đặt phòng</span>
                        <button onClick={() => setSelectedBooking(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>✕</button>
                    </div>

                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: 12 }}>
                            <StatusBadge status={selectedBooking.status} />
                        </div>

                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>
                            {selectedBooking.bookingCode}
                        </div>

                        {selectedBooking.roomImageUrl && (
                            <img src={selectedBooking.roomImageUrl} alt={selectedBooking.roomName}
                                 style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
                        )}

                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>
                            {selectedBooking.roomName}
                        </div>
                        {selectedBooking.workspaceType && (
                            <span style={{ background: '#2563eb', color: '#fff', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                {selectedBooking.workspaceType}
                            </span>
                        )}

                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="fa-regular fa-calendar"></i> Ngày
                                </span>
                                <span style={{ fontWeight: 700 }}>{fmtDate(selectedBooking.startTime)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="fa-regular fa-clock"></i> Thời gian
                                </span>
                                <span style={{ fontWeight: 700 }}>
                                    {fmtTime(selectedBooking.startTime)} – {fmtTime(selectedBooking.endTime)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="fa-solid fa-user"></i> Khách hàng
                                </span>
                                <span style={{ fontWeight: 600 }}>{selectedBooking.userName}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>Tổng tiền</span>
                            <span style={{ fontWeight: 800, fontSize: 18, color: '#003db5' }}>{vnd(selectedBooking.totalAmount)}đ</span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                            {!['CANCELLED','EXPIRED'].includes(selectedBooking.status) && (
                                <button onClick={() => handleCancel(selectedBooking.bookingId)} disabled={actionLoading}
                                        style={{ flex: 1, padding: '9px 12px', background: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                    Hủy đơn
                                </button>
                            )}
                            {selectedBooking.status === 'PENDING_PAYMENT' && (
                                <>
                                    <button onClick={async () => {
                                        setEditBooking({ ...selectedBooking });
                                        try {
                                            const bookingDate = selectedBooking.startTime?.split('T')[0];
                                            const result = await adminGetAllBookings({
                                                roomKeyword: selectedBooking.roomName,
                                                dateFrom: bookingDate,
                                                dateTo: bookingDate,
                                                size: 50,
                                            });
                                            const others = (result.content || []).filter(b =>
                                                b.bookingId !== selectedBooking.bookingId &&
                                                b.status !== 'CANCELLED' && b.status !== 'EXPIRED'
                                            );
                                            setSameRoomBookings(others);
                                        } catch { setSameRoomBookings([]); }
                                    }} style={{ flex: 1, padding: '9px 12px', background: '#fff', color: '#7c3aed', border: '1.5px solid #7c3aed', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                        Chỉnh sửa
                                    </button>
                                    <button onClick={() => handleConfirm(selectedBooking.bookingId)} disabled={actionLoading}
                                            style={{ width: '100%', padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginTop: 2 }}>
                                        Xác nhận thanh toán
                                    </button>
                                </>
                            )}
                            {selectedBooking.status === 'CONFIRMED' && (
                                <button onClick={() => handleRevertToPending(selectedBooking.bookingId)} disabled={actionLoading}
                                        style={{ width: '100%', padding: '10px', background: '#fff', color: '#b45309', border: '1.5px solid #b45309', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginTop: 2 }}>
                                    ↩ Hoàn về chờ thanh toán
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   ĐIỀU PHỐI KHÔNG GIAN — Nhánh booking
══════════════════════════════════════════════════════════════ */
const EMPTY_ROOM = { name: '', workspaceType: 'Phòng họp', capacity: '', price: '', description: '', imageUrl: '', roomStatus: 'Còn trống', amenities: [] };

function AdminSpaceCoordinator() {
    const [rooms, setRooms]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [editRoom, setEditRoom] = useState(null);
    const [addRoom, setAddRoom]   = useState(null);
    const [addLoading, setAddLoading] = useState(false);
    const [toast, setToast]       = useState('');
    const [roomFilter, setRoomFilter]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm]   = useState('');
    const [page, setPage]         = useState(0);
    const PAGE_SIZE = 10;

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(''), 3000);
    };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const data = await adminGetAllRooms();
            setRooms(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 30_000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveRoom = async () => {
        if (!editRoom) return;
        try {
            await axiosInstance.put(`/admin/rooms/${editRoom.roomId}`, {
                name: editRoom.name,
                capacity: Number(editRoom.capacity),
                price: Number(editRoom.price),
                description: editRoom.description,
                location: editRoom.location,
                imageUrl: editRoom.imageUrl,
                workspaceType: editRoom.workspaceType,
                roomStatus: editRoom.roomStatus,
                amenities: (editRoom.amenities || []).map(a => a.name || a),
            });
            showToast('Đã cập nhật phòng thành công.');
            setEditRoom(null);
            fetchRooms();
        } catch (err) {
            showToast(err.response?.data?.message || 'Cập nhật thất bại.', false);
        }
    };

    const handleAddRoom = async () => {
        if (!addRoom) return;
        if (!addRoom.name.trim()) { showToast('Vui lòng nhập tên phòng.', false); return; }
        if (!addRoom.capacity || isNaN(addRoom.capacity)) { showToast('Vui lòng nhập sức chứa hợp lệ.', false); return; }
        if (!addRoom.price || isNaN(addRoom.price)) { showToast('Vui lòng nhập giá hợp lệ.', false); return; }
        setAddLoading(true);
        try {
            await axiosInstance.post('/admin/rooms', {
                name: addRoom.name.trim(),
                capacity: Number(addRoom.capacity),
                price: Number(addRoom.price),
                description: addRoom.description,
                imageUrl: addRoom.imageUrl,
                workspaceType: addRoom.workspaceType,
                roomStatus: addRoom.roomStatus,
                amenities: (addRoom.amenities || []).map(a => a.name || a),
            });
            showToast('Đã thêm không gian mới thành công.');
            setAddRoom(null);
            fetchRooms();
        } catch (err) {
            showToast(err.response?.data?.message || 'Thêm thất bại.', false);
        } finally { setAddLoading(false); }
    };

    const filtered = rooms.filter(r => {
        const matchRoom   = !roomFilter   || r.workspaceType?.includes(roomFilter);
        const matchStatus = !statusFilter || r.roomStatus === statusFilter;
        const matchSearch = !searchTerm   || r.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchRoom && matchStatus && matchSearch;
    });

    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const ALL_AMENITIES = ['TV', 'Máy chiếu', 'Whiteboard', 'Wi-Fi', 'Điều hòa', 'Nước uống', 'Bãi xe'];
    const editAmenityNames = editRoom?.amenities?.map(a => a.name || a) || [];

    const toggleAmenity = (name) => {
        if (!editRoom) return;
        const current = editRoom.amenities || [];
        const exists = current.some(a => (a.name || a) === name);
        setEditRoom({
            ...editRoom,
            amenities: exists
                ? current.filter(a => (a.name || a) !== name)
                : [...current, { name }]
        });
    };

    return (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {toast && (
                <div style={{ position: 'fixed', top: 80, right: 24, background: toast.ok !== false ? '#1e293b' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 8, zIndex: 9999, fontSize: 14 }}>
                    {toast.msg}
                </div>
            )}

            {addRoom !== null && (() => {
                const addAmenityNames = (addRoom.amenities || []).map(a => a.name || a);
                const toggleAddAmenity = (name) => {
                    const exists = addAmenityNames.includes(name);
                    setAddRoom({ ...addRoom, amenities: exists ? addRoom.amenities.filter(a => (a.name||a) !== name) : [...addRoom.amenities, { name }] });
                };
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                        <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>Thêm không gian mới</span>
                                <button onClick={() => setAddRoom(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ảnh phòng (URL)</label>
                                {addRoom.imageUrl && (
                                    <img src={addRoom.imageUrl} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} onError={e => { e.target.style.display='none'; }} />
                                )}
                                <input value={addRoom.imageUrl} onChange={e => setAddRoom({ ...addRoom, imageUrl: e.target.value })} placeholder="Nhập URL ảnh (https://...)" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tên phòng <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={addRoom.name} onChange={e => setAddRoom({ ...addRoom, name: e.target.value })} placeholder="Ví dụ: Phòng họp Panorama" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại không gian</label>
                                <select value={addRoom.workspaceType} onChange={e => setAddRoom({ ...addRoom, workspaceType: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                                    <option value="Phòng họp">Phòng họp</option>
                                    <option value="Phòng làm việc">Phòng làm việc</option>
                                    <option value="Coworking">Coworking</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sức chứa <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={addRoom.capacity} onChange={e => setAddRoom({ ...addRoom, capacity: e.target.value })} placeholder="0" min="1" style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>người</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Giá theo giờ <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={addRoom.price} onChange={e => setAddRoom({ ...addRoom, price: e.target.value })} placeholder="0" min="0" style={{ width: '100%', padding: '9px 22px 9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>đ</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Trạng thái</label>
                                <select value={addRoom.roomStatus} onChange={e => setAddRoom({ ...addRoom, roomStatus: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                                    <option value="Còn trống">Còn trống</option>
                                    <option value="Đang bận">Đang bận</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Tiện ích</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {['TV', 'Máy chiếu', 'Whiteboard', 'Wi-Fi', 'Điều hòa', 'Nước uống', 'Bãi xe'].map(name => (
                                        <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={addAmenityNames.includes(name)} onChange={() => toggleAddAmenity(name)} style={{ accentColor: '#003db5', width: 15, height: 15 }} />
                                            {name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mô tả</label>
                                <textarea value={addRoom.description} onChange={e => setAddRoom({ ...addRoom, description: e.target.value })} rows={3} placeholder="Mô tả ngắn về phòng..." style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setAddRoom(null)} style={{ flex: 1, padding: '10px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
                                <button onClick={handleAddRoom} disabled={addLoading} style={{ flex: 2, padding: '10px', background: '#003db5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: addLoading ? 0.7 : 1 }}>
                                    {addLoading ? 'Đang lưu...' : 'Thêm không gian'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Điều phối không gian</h3>
                        <button onClick={() => setAddRoom({ ...EMPTY_ROOM })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#003db5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            <i className="fa-solid fa-plus"></i> Thêm không gian
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select value={roomFilter}
                                onChange={e => { setRoomFilter(e.target.value); setPage(0); }}
                                style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 150 }}>
                            <option value="">Tất cả không gian</option>
                            <option value="Phòng họp">Phòng họp</option>
                            <option value="Phòng làm việc">Phòng làm việc</option>
                            <option value="Coworking">Coworking</option>
                        </select>
                        <select value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                                style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, minWidth: 150 }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="Còn trống">Còn trống</option>
                            <option value="Đang bận">Đang bận</option>
                            <option value="Bảo trì">Bảo trì</option>
                        </select>
                        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}></i>
                            <input placeholder="Tìm không gian..." value={searchTerm}
                                   onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                                   style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                                {['Mã Phòng','Tên phòng','Loại không gian','Sức chứa','Giá / giờ','Trạng thái','Thao tác'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Không có phòng nào</td></tr>
                            ) : paginated.map(room => (
                                <tr key={room.roomId} style={{ borderBottom: '1px solid #f1f5f9', background: editRoom?.roomId === room.roomId ? '#f0f7ff' : '' }}>
                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                                        R{new Date().getFullYear().toString().slice(2)}{String(new Date().getMonth()+1).padStart(2,'0')}{String(new Date().getDate()).padStart(2,'0')}-{String(room.roomId).padStart(3,'0')}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {room.imageUrl && (
                                                <img src={room.imageUrl} alt={room.name}
                                                     style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                            )}
                                            <span>{room.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <WorkspaceTypeBadge type={room.workspaceType} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>{room.capacity} người</td>
                                    <td style={{ padding: '12px 16px' }}>{vnd(room.price)}đ</td>
                                    <td style={{ padding: '12px 16px' }}><RoomStatusBadge status={room.roomStatus} /></td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button
                                            onClick={() => setEditRoom(editRoom?.roomId === room.roomId ? null : { ...room })}
                                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>
                                            <i className="fa-regular fa-pen-to-square"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                    <span>Hiện thị {paginated.length} trong tổng số {filtered.length} không gian</span>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                                    style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-chevron-left" style={{ fontSize: 11 }}></i>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i} onClick={() => setPage(i)}
                                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid', borderColor: i === page ? '#003db5' : '#e2e8f0', background: i === page ? '#003db5' : '#fff', color: i === page ? '#fff' : '#1e293b', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
                                    style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }}></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {editRoom && (
                <div style={{ width: 340, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Chỉnh sửa không gian</span>
                        <button onClick={() => setEditRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>✕</button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ảnh phòng (URL)</label>
                            {editRoom.imageUrl && (
                                <img src={editRoom.imageUrl} alt={editRoom.name}
                                     style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                                     onError={e => { e.target.style.display='none'; }} />
                            )}
                            <input
                                value={editRoom.imageUrl || ''}
                                onChange={e => setEditRoom({ ...editRoom, imageUrl: e.target.value })}
                                placeholder="Nhập URL ảnh (https://...)"
                                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', color: '#374151' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tên phòng</label>
                            <input value={editRoom.name}
                                   onChange={e => setEditRoom({ ...editRoom, name: e.target.value })}
                                   style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại không gian</label>
                            <select value={editRoom.workspaceType || ''}
                                    onChange={e => setEditRoom({ ...editRoom, workspaceType: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                                <option value="Phòng họp">Phòng họp</option>
                                <option value="Phòng làm việc">Phòng làm việc</option>
                                <option value="Coworking">Coworking</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sức chứa</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={editRoom.capacity}
                                           onChange={e => setEditRoom({ ...editRoom, capacity: e.target.value })}
                                           style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>người</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Giá theo giờ</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={editRoom.price}
                                           onChange={e => setEditRoom({ ...editRoom, price: e.target.value })}
                                           style={{ width: '100%', padding: '9px 22px 9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>đ</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Trạng thái</label>
                            <select value={editRoom.roomStatus || ''}
                                    onChange={e => setEditRoom({ ...editRoom, roomStatus: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                                <option value="Còn trống">Còn trống</option>
                                <option value="Đang bận">Đang bận</option>
                                <option value="Bảo trì">Bảo trì</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Tiện ích</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                {ALL_AMENITIES.map(name => (
                                    <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input type="checkbox"
                                               checked={editAmenityNames.includes(name)}
                                               onChange={() => toggleAmenity(name)}
                                               style={{ accentColor: '#003db5', width: 15, height: 15 }} />
                                        {name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mô tả</label>
                            <textarea value={editRoom.description || ''}
                                      onChange={e => setEditRoom({ ...editRoom, description: e.target.value })}
                                      rows={3}
                                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setEditRoom(null)}
                                    style={{ flex: 1, padding: '10px', background: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                Hủy
                            </button>
                            <button onClick={handleSaveRoom}
                                    style={{ flex: 2, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WorkspaceTypeBadge({ type }) {
    const colorMap = {
        'Phòng họp':      { color: '#2563eb', bg: '#dbeafe' },
        'Phòng làm việc': { color: '#7c3aed', bg: '#ede9fe' },
        'Coworking':      { color: '#d97706', bg: '#fef3c7' },
    };
    const s = colorMap[type] || { color: '#64748b', bg: '#f1f5f9' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {type || '—'}
        </span>
    );
}
