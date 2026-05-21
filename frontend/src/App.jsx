import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// 1. Import các Components giao diện chung (Đã sửa đường dẫn thành ./ chuẩn xác)
import Header from './components/Header';
import Footer from './components/Footer';

// 2. Import các trang CHẮC CHẮN ĐÃ CÓ VÀ ĐANG CHẠY
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';

// 3. Các trang khác (Tạm thời đóng lại nếu Vite báo lỗi không tìm thấy file)
// Nếu nhóm của Nhung có file nào rồi thì chỉ cần xóa dấu // ở đầu dòng đó ra nhé
const Home = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang chủ (Đang phát triển)</h2></div>;
const Spaces = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Không gian</h2></div>;
const Utilities = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Tiện ích</h2></div>;
const News = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Tin tức</h2></div>;
const Contact = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Trang Liên hệ</h2></div>;
const Profile = () => <div style={{padding: '100px', textAlign: 'center'}}><h2>Thông tin cá nhân</h2></div>;

// Component xử lý ẩn/hiện Header & Footer
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const hideLayout = ['/login', '/register'].includes(location.pathname);

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
    return (
        <Router>
            <LayoutWrapper>
                <Routes>
                    {/* Tuyến đường chính */}
                    <Route path="/" element={<Home />} />
                    <Route path="/spaces" element={<Spaces />} />
                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* Tuyến đường xác thực */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Trang quản trị Admin Dashboard của nhóm */}
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </LayoutWrapper>
        </Router>
    );
}

export default App;