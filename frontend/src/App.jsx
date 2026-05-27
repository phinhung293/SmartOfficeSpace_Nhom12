import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedAdminRoute from './components/ProtectedRoute';

import Login          from './pages/Login';
import Register       from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Spaces         from './pages/Spaces';
import RoomDetail     from './pages/Roomdetail';
import Booking        from './pages/Booking';
import Payment        from './pages/Payment';
import BookingHistory from './pages/BookingHistory';
import Profile        from './pages/Profile';

const Home = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role === 'ADMIN') { window.location.replace('/admin'); return null; }
    return <div style={{padding:'100px',textAlign:'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;
};
const Utilities = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Tiện ích</h2></div>;
const News      = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Tin tức</h2></div>;
const Contact   = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Liên hệ</h2></div>;

const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const hideLayout = ['/login', '/register'].includes(location.pathname);
    return (
        <>
            {!hideLayout && <Header />}
            <main className={hideLayout ? '' : 'main-content'}>{children}</main>
            {!hideLayout && <Footer />}
        </>
    );
};

function App() {
    return (
        <Router>
            <LayoutWrapper>
                <Routes>
                    <Route path="/"                 element={<Home />} />
                    <Route path="/spaces"           element={<Spaces />} />
                    <Route path="/spaces/:roomId"   element={<RoomDetail />} />
                    <Route path="/booking/:roomId"  element={<Booking />} />
                    <Route path="/payment"          element={<Payment />} />
                    <Route path="/my-bookings"      element={<BookingHistory />} />
                    <Route path="/profile"          element={<Profile />} />
                    <Route path="/utilities"        element={<Utilities />} />
                    <Route path="/news"             element={<News />} />
                    <Route path="/contact"          element={<Contact />} />
                    <Route path="/login"            element={<Login />} />
                    <Route path="/register"         element={<Register />} />
                    <Route path="/admin"            element={
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
