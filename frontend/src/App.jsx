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
import BookingHistory from './pages/BookingHistory';

// 5. Import trang quản trị của Admin
import AdminDashboard from './pages/AdminDashboard';

// 6. Import các trang tìm kiếm, đặt phòng và thanh toán
import Spaces from './pages/Spaces';
import RoomDetail from './pages/Roomdetail';
import Booking from './pages/Booking';
import Payment from './pages/Payment';

// Payment
import BookingSuccess from './pages/BookingSuccess';
import BookingDetail from './pages/BookingDetail';

// User Notification
import NotificationsPage from './pages/NotificationsPage';
import NotificationDetailPage from './pages/NotificationDetailPage';

// Admin Notification
import AdminNotificationPage from './pages/AdminNotificationPage';
import AdminNotificationAllPage from './pages/AdminNotificationAllPage';
import AdminNotificationSearchPage from './pages/AdminNotificationSearchPage';

// Component tạm cho trang chủ
const Home = () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
        <h2>Trang chủ (Đang phát triển)</h2>
    </div>
);

// Component thông báo đặt phòng thành công
// const BookingSuccess = () => (
//     <div style={{ padding: '80px', textAlign: 'center' }}>
//         <i
//             className="fa-solid fa-circle-check"
//             style={{
//                 fontSize: 64,
//                 color: '#1a7f3c',
//                 marginBottom: 20,
//                 display: 'block'
//             }}
//         ></i>
//         <h2 style={{ fontSize: 28, color: '#1a7f3c' }}>
//             Đặt phòng thành công!
//         </h2>
//         <p style={{ color: '#666', marginTop: 12 }}>
//             Chúng tôi sẽ gửi xác nhận qua email sớm nhất.
//         </p>
//     </div>
// );

// Component phụ: Xử lý ẩn/hiện Header & Footer
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const hideLayout = ['/login', '/register', '/forgot-password'].includes(
        location.pathname
    );

    return (
        <>
            {!hideLayout && <Header />}
            <main className={hideLayout ? '' : 'main-content'}>
                {children}
            </main>
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
                    {/* PUBLIC */}
                    <Route
                        path="/"
                        element={
                            localStorage.getItem('token') &&
                            (
                                JSON.parse(localStorage.getItem('user'))?.role?.roleName === 'ADMIN' ||
                                JSON.parse(localStorage.getItem('user'))?.role === 'ADMIN'
                            )
                                ? <Navigate to="/admin" replace />
                                : <Home />
                        }
                    />

                    {/* SEARCH / BOOKING / PAYMENT */}
                    <Route path="/spaces" element={<Spaces />} />
                    <Route path="/spaces/:roomId" element={<RoomDetail />} />
                    <Route path="/booking/:roomId" element={<Booking />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/booking-success" element={<BookingSuccess />} />

                    {/* Booking Detail */}
                    <Route path="/booking-detail/:bookingId" element={<BookingDetail />} />

                    {/* INFO */}
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* USER NOTIFICATION */}
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/notifications/:id" element={<NotificationDetailPage />} />

                    {/* AUTH */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* PROFILE */}
                    <Route path="/profile" element={<UserDashboardLayout />}>
                        <Route index element={<Navigate to="info" replace />} />
                        <Route path="info" element={<ProfileInfo />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    
                        {/* Lịch sử hóa đơn nằm trong sidebar profile */}
                        <Route path="invoice-history" element={<BookingHistory />} /> 
                    </Route>

                    {/* BOOKING HISTORY */}
                    <Route path="/my-bookings" element={<BookingHistory />} />

                    {/* ADMIN */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedAdminRoute>
                                <AdminDashboard />
                            </ProtectedAdminRoute>
                        }
                    />

                    {/* ADMIN NOTIFICATION */}
                    <Route
                        path="/admin/notifications"
                        element={
                            <ProtectedAdminRoute>
                                <AdminNotificationPage />
                            </ProtectedAdminRoute>
                        }
                    />

                    <Route
                        path="/admin/notifications/all"
                        element={
                            <ProtectedAdminRoute>
                                <AdminNotificationAllPage />
                            </ProtectedAdminRoute>
                        }
                    />

                    <Route
                        path="/admin/notifications/search"
                        element={
                            <ProtectedAdminRoute>
                                <AdminNotificationSearchPage />
                            </ProtectedAdminRoute>
                        }
                    />

                    {/* FALLBACK */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;