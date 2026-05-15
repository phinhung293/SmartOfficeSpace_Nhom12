import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
const Header = () => {
    // Quản lý trạng thái mở/đóng menu mobile
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Quản lý trạng thái scroll để thêm class 'scrolled'
    const [isScrolled, setIsScrolled] = useState(false);
    // Quản lý tab đang được active
    const [activeTab, setActiveTab] = useState('Trang chủ');

    const navItems = ['Trang chủ', 'Không gian', 'Tiện ích', 'Khuyến mãi', 'Liên hệ'];

    useEffect(() => {
        // Lắng nghe sự kiện scroll
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        // Lắng nghe phím ESC để đóng menu
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("keydown", handleKeyDown);

        // Cleanup function khi component unmount
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <>
            {/* Overlay */}
            <div 
                className={`overlay ${isMenuOpen ? "active" : ""}`} 
                onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Header */}
            <header className={`header ${isScrolled ? "scrolled" : ""}`}>
                {/* Logo */}
                <div className="logo">
                    <img src={logoImg} alt="Smart Office Space Logo" />
                </div>

                {/* Menu Toggle */}
                <div className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <i className="fa-solid fa-bars"></i>
                </div>

                {/* Navbar */}
                <nav className={`navbar ${isMenuOpen ? "active" : ""}`}>
                    {navItems.map((item, index) => (
                        <a 
                            href="#" 
                            key={index}
                            className={activeTab === item ? "active" : ""}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(item);
                                setIsMenuOpen(false); // Đóng menu mobile khi chọn tab
                            }}
                        >
                            {item}
                        </a>
                    ))}

                    {/* Mobile Extra */}
                    <div className="mobile-extra">
                        <div className="mobile-language">
                            <i className="fa-solid fa-globe"></i>
                            <span>VI</span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <button className="mobile-login">Đăng nhập</button>
                        <button className="mobile-register">Đăng ký</button>
                    </div>
                </nav>

                {/* Right */}
                <div className="header-right">
                    <div className="language">
                        <i className="fa-solid fa-globe"></i>
                        <span>VI</span>
                        <i className="fa-solid fa-chevron-down"></i>
                    </div>
                    <button className="login-btn">Đăng nhập</button>
                    <button className="register-btn">Đăng ký</button>
                </div>
            </header>
        </>
    );
};

export default Header;