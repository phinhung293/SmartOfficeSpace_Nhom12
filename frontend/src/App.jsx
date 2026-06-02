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

// 4. Import các trang quản lý cá nhân (User Profile & History)
import UserDashboardLayout from './pages/UserDashboardLayout';
import ProfileInfo from './pages/ProfileInfo';
import ChangePassword from './pages/ChangePassword';
import BookingHistory from './pages/BookingHistory'; // Trang xem lịch sử đặt phòng mới gộp từ nhánh booking

// 5. Import trang quản trị của Admin
import AdminDashboard from './pages/AdminDashboard';

// 6. Import các trang tìm kiếm, đặt phòng và thanh toán (Tích hợp từ cả 2 nhánh)
import Spaces         from './pages/Spaces';
import RoomDetail     from './pages/Roomdetail';
import Booking        from './pages/Booking';
import Payment        from './pages/Payment';        // Trang thanh toán mới gộp từ nhánh booking
import BookingSuccess from './pages/BookingSuccess';
import BookingDetail  from './pages/BookingDetail';

// Component tạm cho trang chủ
const Home = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;



// Component phụ: Xử lý ẩn/hiện Header & Footer cho các trang đăng nhập/đăng ký
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const hideLayout = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <>
            {!hideLayout && <Header />}
            <main className={hideLayout ? '' : 'main-content'}>{children}</main>
            {!hideLayout && <Footer />}
        </>
    );
};

// Component phụ: Bảo vệ tuyến đường dành riêng cho Admin (Khớp logic chuẩn của develop)
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
                        (localStorage.getItem('token') && (JSON.parse(localStorage.getItem('user'))?.role?.roleName === 'ADMIN' || JSON.parse(localStorage.getItem('user'))?.role === 'ADMIN'))
                            ? <Navigate to="/admin" replace />
                            : <Home />
                    } />

                    {/* --- TUYẾN ĐƯỜNG TÌM KIẾM, ĐẶT PHÒNG & THANH TOÁN --- */}
                    <Route path="/spaces"           element={<Spaces />} />
                    <Route path="/spaces/:roomId"   element={<RoomDetail />} />
                    <Route path="/booking/:roomId"  element={<Booking />} />
                    <Route path="/payment"          element={<Payment />} /> {/* Gộp route thanh toán của nhánh booking */}
                    <Route path="/booking-success" element={<BookingSuccess />} />

                    {/* CHI TIẾT ĐẶT PHÒNG – truy cập từ lịch sử hoặc sau thanh toán */}
                    <Route path="/booking-detail/:bookingId" element={<BookingDetail />} />

                    {/* --- TUYẾN ĐƯỜNG THÔNG TIN --- */}
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news"      element={<News />} />
                    <Route path="/contact"   element={<Contact />} />

                    {/* --- TUYẾN ĐƯỜNG XÁC THỰC (AUTH ROUTES) --- */}
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* --- TUYẾN ĐƯỜNG CÁ NHÂN USER (Sử dụng cấu hình Nested Routes gọn gàng) --- */}
                    <Route path="/profile" element={<UserDashboardLayout />}>
                        <Route index element={<Navigate to="info" replace />} />
                        <Route path="info"            element={<ProfileInfo />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    
                        {/* Lịch sử hóa đơn nằm trong sidebar profile */}
                        <Route path="invoice-history" element={<BookingHistory />} /> 
                    </Route>

                    {/* Lịch sử đặt phòng của riêng user (Tích hợp từ nhánh booking) */}
                    <Route path="/my-bookings" element={<BookingHistory />} />

                    {/* --- TUYẾN ĐƯỜNG QUẢN TRỊ ADMIN --- */}
                    <Route path="/admin" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />

                    {/* Bẫy lỗi URL - Tự động quay về trang chủ nếu gõ bừa */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;