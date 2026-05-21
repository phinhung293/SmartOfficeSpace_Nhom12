import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Menu mặc định là 'tong-quan' để hiển thị toàn bộ biểu đồ thống kê khi vừa đăng nhập vào
    const [activeMenu, setActiveMenu] = useState('tong-quan');
    
    // Quản lý trạng thái đóng/mở các menu con dạng dropdown bên Sidebar
    const [openSubMenus, setOpenSubMenus] = useState({
        userMgmt: false,
        spaceMgmt: false,
        bookingMgmt: false,
        paymentMgmt: false
    });

    const toggleSubMenu = (menuKey) => {
        setOpenSubMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
    };

    return (
        <div className="admin-main-body-layout">
            
            {/* ====== 1. THANH SIDEBAR MENU BÊN TRÁI (ĐẦY ĐỦ 6 MỤC CHUẨN MẪU) ====== */}
            <aside className="admin-sidebar">
                <ul className="sidebar-menu">
                    
                    {/* Mục 1: Tổng quan */}
                    <li className={`menu-node ${activeMenu === 'tong-quan' ? 'active-node' : ''}`} onClick={() => setActiveMenu('tong-quan')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-house-chimney menu-icon"></i>
                            <span>Tổng quan</span>
                        </div>
                    </li>

                    {/* Mục 2: Quản lý người dùng */}
                    <li className="menu-node">
                        <div className="menu-link-item has-sub" onClick={() => toggleSubMenu('userMgmt')}>
                            <i className="fa-solid fa-user-group menu-icon"></i>
                            <span>Quản lý người dùng</span>
                            <i className={`fa-solid fa-chevron-down sub-arrow ${openSubMenus.userMgmt ? 'rotate' : ''}`}></i>
                        </div>
                        {openSubMenus.userMgmt && (
                            <ul className="sidebar-sub-menu">
                                <li className="sub-menu-item"><span className="dot-icon"></span> Danh sách thành viên</li>
                                <li className="sub-menu-item"><span className="dot-icon"></span> Phân quyền tài khoản</li>
                            </ul>
                        )}
                    </li>

                    {/* Mục 3: Quản lý không gian */}
                    <li className="menu-node">
                        <div className="menu-link-item has-sub" onClick={() => toggleSubMenu('spaceMgmt')}>
                            <i className="fa-solid fa-cubes menu-icon"></i>
                            <span>Quản lý không gian</span>
                            <i className={`fa-solid fa-chevron-down sub-arrow ${openSubMenus.spaceMgmt ? 'rotate' : ''}`}></i>
                        </div>
                        {openSubMenus.spaceMgmt && (
                            <ul className="sidebar-sub-menu">
                                <li className="sub-menu-item"><span className="dot-icon"></span> Danh sách văn phòng</li>
                                <li className="sub-menu-item"><span className="dot-icon"></span> Sơ đồ thiết lập</li>
                            </ul>
                        )}
                    </li>

                    {/* Mục 4: Quản lý đặt phòng */}
                    <li className="menu-node">
                        <div className="menu-link-item has-sub" onClick={() => toggleSubMenu('bookingMgmt')}>
                            <i className="fa-regular fa-calendar-days menu-icon"></i>
                            <span>Quản lý đặt phòng</span>
                            <i className={`fa-solid fa-chevron-down sub-arrow ${openSubMenus.bookingMgmt ? 'rotate' : ''}`}></i>
                        </div>
                        {openSubMenus.bookingMgmt && (
                            <ul className="sidebar-sub-menu">
                                <li className={`sub-menu-item ${activeMenu === 'lich-su' ? 'active' : ''}`} onClick={() => setActiveMenu('lich-su')}>
                                    <span className="dot-icon"></span> Lịch sử đặt phòng
                                </li>
                                <li className={`sub-menu-item ${activeMenu === 'dieu-phoi' ? 'active' : ''}`} onClick={() => setActiveMenu('dieu-phoi')}>
                                    <span className="dot-icon"></span> Điều phối không gian
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* Mục 5: Thanh toán & Hóa đơn */}
                    <li className="menu-node">
                        <div className="menu-link-item has-sub" onClick={() => toggleSubMenu('paymentMgmt')}>
                            <i className="fa-solid fa-file-invoice-dollar menu-icon"></i>
                            <span>Thanh toán & Hóa đơn</span>
                            <i className={`fa-solid fa-chevron-down sub-arrow ${openSubMenus.paymentMgmt ? 'rotate' : ''}`}></i>
                        </div>
                        {openSubMenus.paymentMgmt && (
                            <ul className="sidebar-sub-menu">
                                <li className="sub-menu-item"><span className="dot-icon"></span> Hóa đơn dịch vụ</li>
                                <li className="sub-menu-item"><span className="dot-icon"></span> Lịch sử giao dịch</li>
                            </ul>
                        )}
                    </li>

                    {/* Mục 6: Báo cáo thống kê */}
                    <li className={`menu-node ${activeMenu === 'thong-ke' ? 'active-node' : ''}`} onClick={() => setActiveMenu('thong-ke')}>
                        <div className="menu-link-item">
                            <i className="fa-solid fa-chart-line menu-icon"></i>
                            <span>Báo cáo thống kê</span>
                        </div>
                    </li>
                </ul>
            </aside>

            {/* ====== 2. NỘI DUNG THỐNG KÊ CHI TIẾT BÊN PHẢI (ĐÃ XÓA BREADCRUMB) ====== */}
            <main className="admin-main-content">
                
                {activeMenu === 'tong-quan' && (
                    <div className="dashboard-view-container">
                        
                        {/* 4 Cards Thống kê đầu trang */}
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-icon blue-bg"><i className="fa-solid fa-users"></i></div>
                                <div className="metric-info">
                                    <p className="metric-label">Tổng người dùng</p>
                                    <h3 className="metric-value">120</h3>
                                </div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon purple-bg"><i className="fa-solid fa-building"></i></div>
                                <div className="metric-info">
                                    <p className="metric-label">Phòng đang sử dụng</p>
                                    <h3 className="metric-value">15</h3>
                                </div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon lightblue-bg"><i className="fa-regular fa-calendar-check"></i></div>
                                <div className="metric-info">
                                    <p className="metric-label">Đơn đặt hôm nay</p>
                                    <h3 className="metric-value">28</h3>
                                </div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-icon green-bg"><i className="fa-solid fa-dollar-sign"></i></div>
                                <div className="metric-info">
                                    <p className="metric-label">Doanh thu hôm nay</p>
                                    <h3 className="metric-value">12.000.000đ</h3>
                                </div>
                            </div>
                        </div>

                        {/* Hàng 2: Thông báo hệ thống & Tình trạng phòng hiện tại */}
                        <div className="dashboard-row double-column">
                            <div className="dashboard-card card-half">
                                <div className="card-header-tabs">
                                    <button className="tab-btn active">Quan trọng</button>
                                    <button className="tab-btn">Thông báo</button>
                                </div>
                                <div className="card-body-list">
                                    <div className="list-item-notify">
                                        <div className="notify-title">Bảo trì hệ thống ngày 20/05/2026</div>
                                        <div className="notify-time">18/04/2026 08:30</div>
                                    </div>
                                    <div className="list-item-notify">
                                        <div className="notify-title">2 thanh toán thất bại</div>
                                        <div className="notify-time">18/04/2026 08:15</div>
                                    </div>
                                    <div className="list-item-notify">
                                        <div className="notify-title">Doanh thu hôm nay đạt 12.000.000đ</div>
                                        <div className="notify-time">18/04/2026 08:05</div>
                                    </div>
                                    <a href="#" className="view-all-link">&gt;&gt;Xem tất cả</a>
                                </div>
                            </div>

                            <div className="dashboard-card card-half">
                                <div className="card-header-title">Tình trạng phòng hiện tại</div>
                                <div className="card-body-table">
                                    <table className="admin-dash-table">
                                        <thead>
                                            <tr>
                                                <th>Tên phòng</th><th>Loại phòng</th><th>Sức chứa</th><th>Giá (VND/giờ)</th><th>Trạng thái</th><th>Vị trí</th><th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>Phòng A</td><td>Phòng họp</td><td>6 người</td><td>200.000</td><td><span className="badge badge-empty">Trống</span></td><td>Tầng 1</td><td><span className="action-txt">Xem</span></td></tr>
                                            <tr><td>Phòng B</td><td>Phòng họp</td><td>8 người</td><td>250.000</td><td><span className="badge badge-busy">Đang sử dụng</span></td><td>Tầng 2</td><td><span className="action-txt">Xem</span></td></tr>
                                            <tr><td>Phòng C</td><td>Phòng làm việc</td><td>2 người</td><td>120.000</td><td><span className="badge badge-booked">Đã đặt</span></td><td>Tầng 2</td><td><span className="action-txt">Xem</span></td></tr>
                                            <tr><td>Bàn làm việc 1</td><td>Bàn chung</td><td>1 người</td><td>50.000</td><td><span className="badge badge-empty">Trống</span></td><td>Tầng 3</td><td><span className="action-txt">Xem</span></td></tr>
                                        </tbody>
                                    </table>
                                    <a href="#" className="view-all-link">&gt;&gt;Xem tất cả</a>
                                </div>
                            </div>
                        </div>

                        {/* Hàng 3: Đơn đặt phòng & Biểu đồ cột doanh thu giả lập */}
                        <div className="dashboard-row double-column" style={{marginTop: '25px'}}>
                            <div className="dashboard-card card-half">
                                <div className="card-header-title">Đơn đặt phòng hôm nay</div>
                                <div className="card-body-table">
                                    <table className="admin-dash-table">
                                        <thead>
                                            <tr>
                                                <th>Booking ID</th><th>Người dùng</th><th>Phòng</th><th>Thời gian</th><th>Tổng tiền</th><th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>B001</td><td>Nguyễn Văn A</td><td>Phòng A</td><td>18/04 09:00 - 11:00</td><td>400.000đ</td><td><span className="status-success">Đã thanh toán</span></td></tr>
                                            <tr><td>B002</td><td>Nguyễn Văn B</td><td>Phòng B</td><td>18/04 10:00 - 12:00</td><td>500.000đ</td><td><span className="status-success">Đã thanh toán</span></td></tr>
                                            <tr><td>B003</td><td>Nguyễn Văn C</td><td>Phòng C</td><td>18/04 13:00 - 15:00</td><td>300.000đ</td><td><span className="status-pending">Chờ thanh toán</span></td></tr>
                                            <tr><td>B004</td><td>Nguyễn Văn D</td><td>Phòng D</td><td>18/04 14:00 - 16:00</td><td>200.000đ</td><td><span className="status-cancel">Đã hủy</span></td></tr>
                                        </tbody>
                                    </table>
                                    <a href="#" className="view-all-link">&gt;&gt;Xem tất cả</a>
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
                                <div className="mock-chart-container">
                                    <div className="chart-y-axis"><span>12Mđ</span><span>9Mđ</span><span>6Mđ</span><span>3Mđ</span><span>0đ</span></div>
                                    <div className="chart-bars-area">
                                        <div className="chart-bar-wrapper"><div className="actual-bar" style={{height: '55%'}}></div><span className="bar-label">Tháng 1</span></div>
                                        <div className="chart-bar-wrapper"><div className="actual-bar" style={{height: '68%'}}></div><span className="bar-label">Tháng 2</span></div>
                                        <div className="chart-bar-wrapper"><div className="actual-bar" style={{height: '48%'}}></div><span className="bar-label">Tháng 3</span></div>
                                        <div className="chart-bar-wrapper"><div className="actual-bar" style={{height: '90%'}}></div><span className="bar-label">Tháng 4</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeMenu === 'dieu-phoi' && (
                    <div className="admin-workspace-card" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                        <h3 style={{marginBottom: '10px'}}>Khu vực điều phối không gian làm việc</h3>
                        <p style={{color: '#64748b', fontStyle: 'italic', fontSize: '14px'}}>Đang tải danh sách sơ đồ phòng làm việc thực tế...</p>
                    </div>
                )}
            </main>

        </div>
    );
};

export default AdminDashboard;