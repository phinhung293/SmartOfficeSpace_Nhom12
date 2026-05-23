import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// 1. Import các Components giao diện chung
import Header from './components/Header';
import Footer from './components/Footer';

// 2. Import các trang
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard'; // Đảm bảo đường dẫn này đúng
import ForgotPassword from './pages/ForgotPassword';

import UserDashboardLayout from './pages/UserDashboardLayout';
import ProfileInfo from './pages/ProfileInfo';
import ChangePassword from './pages/ChangePassword';

// 3. Các trang khác (Tạm thời đóng lại)
const Home = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;
const Spaces = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Không gian</h2></div>;
const Utilities = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Tiện ích</h2></div>;
const News = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Tin tức</h2></div>;
const Contact = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Liên hệ</h2></div>;

// Component xử lý ẩn/hiện Header & Footer
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    
    // ĐÃ SỬA: Bỏ đoạn của admin đi, để Header/Footer hiện lên bình thường
    const hideLayout = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <>
            {!hideLayout && <Header />}
            <main className={hideLayout ? "" : "main-content"}>
                {children}
            </main>
            {!hideLayout && <Footer />}
        </>
    );
};
function App() {
    const ProtectedAdminRoute = ({ children }) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const role = user?.role?.roleName || user?.role;

        if (!token || role !== 'ADMIN') {
            return <Navigate to="/login" replace />;
        }
        return children;
    };
    return (
        <Router>
            <LayoutWrapper>
                <Routes>
                    <Route path="/" element={
                        (localStorage.getItem('token') && (JSON.parse(localStorage.getItem('user'))?.role?.roleName === 'ADMIN' || JSON.parse(localStorage.getItem('user'))?.role === 'ADMIN'))
                        ? <Navigate to="/admin" replace /> 
                        : <Home />
                    } />
                    {/* Tuyến đường chính */}
                    <Route path="/" element={<Home />} />
                    <Route path="/spaces" element={<Spaces />} />
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* Tuyến đường xác thực */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* --- TUYẾN ĐƯỜNG CÁ NHÂN --- */}
                    <Route path="/profile" element={<UserDashboardLayout />}>
                        <Route index element={<Navigate to="info" replace />} />
                        <Route path="info" element={<ProfileInfo />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Route>

                    {/* --- TRANG QUẢN TRỊ ADMIN --- */}
                    <Route path="/admin" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;