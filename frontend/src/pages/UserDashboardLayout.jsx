import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './css/UserDashboard.css'; // File CSS bạn tự tạo thêm để style nhé

const UserDashboardLayout = () => {
    return (
        <div className="user-dashboard-container">
            <aside className="dashboard-sidebar">
                <nav className="sidebar-menu">
                    <NavLink to="/profile/info" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                        <i className="fa-regular fa-user"></i> Thông tin cá nhân
                    </NavLink>
                    
                    <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                        <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử đặt phòng
                    </NavLink>
                    
                    <NavLink to="/profile/invoice-history" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                        <i className="fa-solid fa-file-invoice-dollar"></i> Lịch sử hóa đơn
                    </NavLink>
                </nav>

                {/* Khối Cần hỗ trợ giống trong Figma */}
                <div className="support-box">
                    <div className="support-icon"><i className="fa-solid fa-headset"></i> Cần hỗ trợ?</div>
                    <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
                    <button className="support-btn">Liên hệ hỗ trợ</button>
                </div>
            </aside>

            {/* Nội dung bên phải (Sẽ thay đổi tùy vào việc người dùng chọn menu nào) */}
            <main className="dashboard-content">
                <Outlet /> {/* Đây là "lỗ hổng" để React nhét các trang con vào */}
            </main>
        </div>
    );
};

export default UserDashboardLayout;