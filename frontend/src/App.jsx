import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Login          from './pages/Login';
import Register       from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Spaces         from './pages/Spaces';
import RoomDetail     from './pages/Roomdetail';
import Booking        from './pages/Booking';

const Home      = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;
const Utilities = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Tiện ích</h2></div>;
const News      = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Tin tức</h2></div>;
const Contact   = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Trang Liên hệ</h2></div>;
const Profile   = () => <div style={{padding:'100px',textAlign:'center'}}><h2>Thông tin cá nhân</h2></div>;
const BookingSuccess = () => (
    <div style={{padding:'80px',textAlign:'center'}}>
        <i className="fa-solid fa-circle-check" style={{fontSize:64,color:'#1a7f3c',marginBottom:20,display:'block'}}></i>
        <h2 style={{fontSize:28,color:'#1a7f3c'}}>Đặt phòng thành công!</h2>
        <p style={{color:'#666',marginTop:12}}>Chúng tôi sẽ gửi xác nhận qua email sớm nhất.</p>
    </div>
);

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
                    <Route path="/booking-success"  element={<BookingSuccess />} />
                    <Route path="/utilities"        element={<Utilities />} />
                    <Route path="/news"             element={<News />} />
                    <Route path="/contact"          element={<Contact />} />
                    <Route path="/login"            element={<Login />} />
                    <Route path="/register"         element={<Register />} />
                    <Route path="/profile"          element={<Profile />} />
                    <Route path="/admin"            element={<AdminDashboard />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;