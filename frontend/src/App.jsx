import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// 1. Import các Components giao diện chung
import Header from './components/Header';
import Footer from './components/Footer';

// 2. Import các trang xác thực hệ thống
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// 3. Import các trang giao diện công cộng (Public Pages)
import Utilities from './pages/Utilities';
import Contact from './pages/Contact';
import News from './pages/News';

// 4. Import các trang quản lý cá nhân (User Profile)
import UserDashboardLayout from './pages/UserDashboardLayout';
import ProfileInfo from './pages/ProfileInfo';
import ChangePassword from './pages/ChangePassword';

// 5. Import trang quản trị của Admin
import AdminDashboard from './pages/AdminDashboard';

// Các trang còn lại đang phát triển (Tạm thời để component mẫu)
const Home = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;
const Spaces = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Không gian</h2></div>;


// Component phụ: Xử lý ẩn/hiện Header & Footer cho các trang đăng nhập/đăng ký
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    
    // Ẩn Layout ở các trang không cần thiết
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


// Component phụ: Bảo vệ tuyến đường dành riêng cho Admin (Route Guard)
const ProtectedAdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const role = user?.role?.roleName || user?.role;

    if (!token || role !== 'ADMIN') {
        // Nếu không có token hoặc không phải admin, đá thẳng về trang login
        return <Navigate to="/login" replace />;
    }
    return children;
};


function App() {
    return (
        <Router>
            <LayoutWrapper>
                <Routes>
                    {/* --- TUYẾN ĐƯỜNG CÔNG CỘNG (PUBLIC ROUTES) --- */}
                    <Route path="/" element={
                        // Nếu đã đăng nhập với quyền ADMIN, tự động bẻ lái sang trang quản trị
                        (localStorage.getItem('token') && (JSON.parse(localStorage.getItem('user'))?.role?.roleName === 'ADMIN' || JSON.parse(localStorage.getItem('user'))?.role === 'ADMIN'))
                        ? <Navigate to="/admin" replace /> 
                        : <Home />
                    } />
                    <Route path="/spaces" element={<Spaces />} />
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* --- TUYẾN ĐƯỜNG XÁC THỰC (AUTH ROUTES) --- */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* --- TUYẾN ĐƯỜNG CÁ NHÂN USER (RBAC CONFIG) --- */}
                    <Route path="/profile" element={<UserDashboardLayout />}>
                        <Route index element={<Navigate to="info" replace />} />
                        <Route path="info" element={<ProfileInfo />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Route>

                    {/* --- TUYẾN ĐƯỜNG QUẢN TRỊ ADMIN (PROTECTED ROUTES) --- */}
                    <Route path="/admin" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />

                    {/* Tự động chuyển hướng về trang chủ nếu người dùng gõ sai URL bừa bãi */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;