import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement'; 
import './css/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState('tong-quan');

    return (
        <div className="admin-main-body-layout">
            <aside className="admin-sidebar">

                <ul className="sidebar-menu">
                    {[
                        { id: 'tong-quan', icon: 'fa-house', name: 'Tổng quan' },
                        { id: 'quan-ly-nguoi-dung', icon: 'fa-user-group', name: 'Quản lý người dùng' },
                        { id: 'quan-ly-khong-gian', icon: 'fa-cubes', name: 'Quản lý không gian' },
                        { id: 'quan-ly-dat-phong', icon: 'fa-calendar-check', name: 'Quản lý đặt phòng' },
                        { id: 'thanh-toan', icon: 'fa-file-invoice-dollar', name: 'Thanh toán & Hóa đơn' },
                        { id: 'thong-ke', icon: 'fa-chart-line', name: 'Báo cáo thống kê' }
                    ].map(item => (
                        <li key={item.id} className={`menu-node ${activeMenu === item.id ? 'active-node' : ''}`} onClick={() => setActiveMenu(item.id)}>
                            <div className="menu-link-item"><i className={`fa-solid ${item.icon} menu-icon`}></i><span>{item.name}</span></div>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="admin-main-content">
                {activeMenu === 'tong-quan' && (
                    <div className="dashboard-view-container">
                        <h2 className="admin-page-title">Tổng quan hệ thống</h2>
                        <div className="metrics-grid">
                            <div className="metric-card"><div className="metric-icon blue-bg"><i className="fa-solid fa-users"></i></div><div className="metric-info"><p className="metric-label">Tổng người dùng</p><h3 className="metric-value">120</h3></div></div>
                            <div className="metric-card"><div className="metric-icon purple-bg"><i className="fa-solid fa-building"></i></div><div className="metric-info"><p className="metric-label">Phòng đang sử dụng</p><h3 className="metric-value">15</h3></div></div>
                            <div className="metric-card"><div className="metric-icon lightblue-bg"><i className="fa-regular fa-calendar-check"></i></div><div className="metric-info"><p className="metric-label">Đơn đặt hôm nay</p><h3 className="metric-value">28</h3></div></div>
                            <div className="metric-card"><div className="metric-icon green-bg"><i className="fa-solid fa-dollar-sign"></i></div><div className="metric-info"><p className="metric-label">Doanh thu hôm nay</p><h3 className="metric-value">12.000.000đ</h3></div></div>
                        </div>
                    </div>
                )}
                {activeMenu === 'quan-ly-nguoi-dung' && <UserManagement />}
                {activeMenu !== 'tong-quan' && activeMenu !== 'quan-ly-nguoi-dung' && (
                    <div style={{padding: '30px'}}><h3>Giao diện đang phát triển...</h3></div>
                )}
            </main>
        </div>
    );
};
export default AdminDashboard;