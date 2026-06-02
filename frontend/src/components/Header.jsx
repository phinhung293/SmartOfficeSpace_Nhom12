import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import logoImg from '../assets/logo.png';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role || "";

    const navItems = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Không gian', path: '/spaces' },
        { name: 'Tiện ích', path: '/utilities' },
        { name: 'Tin tức', path: '/news' },
        { name: 'Liên hệ', path: '/contact' }
    ];

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsDropdownOpen(false);
        navigate('/');
        window.location.reload();
    };

    return (
        <>
            <div className={`overlay ${isMenuOpen ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}></div>

            <header className={`header ${isScrolled ? "scrolled" : ""}`}>
                {/* LOGO */}
                <div className="logo" onClick={() => navigate(role === 'ADMIN' ? '/admin' : '/')}>
                    <img src={logoImg} alt="Logo" />
                </div>

                <div className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <i className="fa-solid fa-bars"></i>
                </div>

                {/* NAVBAR TRUNG TÂM */}
                <nav className={`navbar ${isMenuOpen ? "active" : ""}`}>
                    {role !== 'ADMIN' ? (
                        navItems.map((item, index) => (
                            <NavLink
                                to={item.path}
                                key={index}
                                onClick={() => setIsMenuOpen(false)}
                                // Tự động thêm class "active" khi trang đó được chọn
                                className={({ isActive }) => isActive ? "nav-item-link active" : "nav-item-link"}
                            >
                                {item.name}
                            </NavLink>
                        ))
                    ) : (
                        <span style={{ color: '#003594', fontSize: '16px', fontWeight: '700' }}>
                            HỆ THỐNG QUẢN TRỊ QUẢN LÝ
                        </span>
                    )}
                </nav>

                {/* HEADER RIGHT */}
                <div className="header-right">
                    <div className="language">
                        <i className="fa-solid fa-globe"></i>
                        <span>VI</span>
                        <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }}></i>
                    </div>

                    {user ? (
                        <div className="user-logged-wrapper">
                            <div className="notification-bell">
                                <i className="fa-regular fa-bell"></i>
                                <span className="bell-badge"></span>
                            </div>

                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <i className="fa-regular fa-user-circle avatar-icon"></i>
                                    <span className="user-display-name">{user.name}</span>
                                    <i className={`fa-solid fa-chevron-down arrow-toggle ${isDropdownOpen ? 'rotate' : ''}`}></i>
                                </div>

                                {isDropdownOpen && (
                                    <div className="user-dropdown-menu">
                                        {role === 'ADMIN' ? (
                                            /* KHI LÀ ADMIN XỔ XUỐNG: CHỈ CÓ CÁ NHÂN & ĐĂNG XUẤT */
                                            <>
                                                <div className="dropdown-item" onClick={() => { navigate('/profile/info'); setIsDropdownOpen(false); }}>
                                                    <i className="fa-regular fa-id-card"></i> Thông tin cá nhân
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div className="dropdown-item logout" onClick={handleLogout}>
                                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
                                                </div>
                                            </>
                                        ) : (
                                            /* KHI LÀ USER THƯỜNG XỔ XUỐNG: ĐẦY ĐỦ CÁC MỤC */
                                            <>
                                                <div className="dropdown-header-title">Tài khoản</div>
                                                <div className="dropdown-item" onClick={() => { navigate('/profile/info'); setIsDropdownOpen(false); }}>
                                                    <i className="fa-regular fa-id-card"></i> Thông tin cá nhân
                                                </div>
                                                <div className="dropdown-item" onClick={() => { navigate('/my-bookings'); setIsDropdownOpen(false); }}>
                                                    <i className="fa-regular fa-calendar-check"></i> Lịch sử đặt phòng
                                                </div>
                                                <div className="dropdown-item" onClick={() => { navigate('/profile/invoice-history'); setIsDropdownOpen(false); }}>
                                                    <i className="fa-regular fa-file-lines"></i> Lịch sử hóa đơn
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div className="dropdown-item logout" onClick={handleLogout}>
                                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <button className="login-btn" onClick={() => navigate('/login')}>Đăng nhập</button>
                            <button className="register-btn" onClick={() => navigate('/register')}>Đăng ký</button>
                        </>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;