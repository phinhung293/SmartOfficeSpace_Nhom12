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

// 6. Import các trang đặt phòng (Từ nhánh feature/search-function)
import Spaces         from './pages/Spaces';
import RoomDetail     from './pages/Roomdetail';
import Booking        from './pages/Booking';

// Component tạm cho trang chủ
const Home = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;

// Component thông báo đặt phòng thành công (Từ nhánh feature/search-function)
const BookingSuccess = () => (
    <div style={{padding:'80px',textAlign:'center'}}>
        <i className="fa-solid fa-circle-check" style={{fontSize:64,color:'#1a7f3c',marginBottom:20,display:'block'}}></i>
        <h2 style={{fontSize:28,color:'#1a7f3c'}}>Đặt phòng thành công!</h2>
        <p style={{color:'#666',marginTop:12}}>Chúng tôi sẽ gửi xác nhận qua email sớm nhất.</p>
    </div>
);

// Component phụ: Xử lý ẩn/hiện Header & Footer
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    
    // Đã gộp cả forgot-password vào để ẩn Header/Footer
    const hideLayout = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <>
            {!hideLayout && <Header />}
            <main className={hideLayout ? '' : 'main-content'}>{children}</main>
            {!hideLayout && <Footer />}
        </>
    );
};

// Component phụ: Bảo vệ tuyến đường dành riêng cho Admin
const ProtectedAdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const role = user?.role?.roleName || user?.role;

    if (!token || role !== 'ADMIN') {
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
                        // Bẻ lái sang admin nếu là ADMIN
                        (localStorage.getItem('token') && (JSON.parse(localStorage.getItem('user'))?.role?.roleName === 'ADMIN' || JSON.parse(localStorage.getItem('user'))?.role === 'ADMIN'))
                        ? <Navigate to="/admin" replace /> 
                        : <Home />
                    } />
                    
                    {/* --- TUYẾN ĐƯỜNG TÌM KIẾM & ĐẶT PHÒNG --- */}
                    <Route path="/spaces"           element={<Spaces />} />
                    <Route path="/spaces/:roomId"   element={<RoomDetail />} />
                    <Route path="/booking/:roomId"  element={<Booking />} />
                    <Route path="/booking-success"  element={<BookingSuccess />} />
                    
                    {/* --- TUYẾN ĐƯỜNG THÔNG TIN --- */}
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* --- TUYẾN ĐƯỜNG XÁC THỰC (AUTH ROUTES) --- */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* --- TUYẾN ĐƯỜNG CÁ NHÂN USER --- */}
                    <Route path="/profile" element={<UserDashboardLayout />}>
                        <Route index element={<Navigate to="info" replace />} />
                        <Route path="info" element={<ProfileInfo />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Route>

                    {/* --- TUYẾN ĐƯỜNG QUẢN TRỊ ADMIN --- */}
                    <Route path="/admin" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />

                    {/* Bẫy lỗi URL */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;