import React from 'react';
import logoImg2 from '../assets/logo2.png';
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                {/* COLUMN 1 */}
                <div className="footer-col">
                    <div className="footer-logo">
                        {/* Xóa dòng <i className="fa-solid fa-building"></i> và thay bằng dòng img dưới đây */}
                        <img src={logoImg2} alt="Logo" />
                        
                        {/* Phần chữ vẫn giữ nguyên */}
                        <div>
                            <h2>SOS</h2>
                            <p>SMART OFFICE SPACE</p>
                        </div>
                    </div>
                    <p className="footer-desc">
                        Nền tảng đặt chỗ không gian làm việc hiện đại,
                        linh hoạt và tiện lợi.
                    </p>
                    <div className="social-icons">
                        <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
                        <a href="#"><i className="fa-brands fa-instagram"></i></a>
                        <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
                        <a href="#"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                </div>

                {/* COLUMN 2 */}
                <div className="footer-col">
                    <h3>Về chúng tôi</h3>
                    <a href="#">Giới thiệu</a>
                    <a href="#">Tin tức</a>
                    <a href="#">Tuyển dụng</a>
                    <a href="#">Chính sách bảo mật</a>
                </div>

                {/* COLUMN 3 */}
                <div className="footer-col">
                    <h3>Hỗ trợ</h3>
                    <a href="#">Trung tâm hỗ trợ</a>
                    <a href="#">Hướng dẫn sử dụng</a>
                    <a href="#">Câu hỏi thường gặp</a>
                    <a href="#">Liên hệ hỗ trợ</a>
                </div>

                {/* COLUMN 4 */}
                <div className="footer-col">
                    <h3>Liên hệ</h3>
                    <p><i className="fa-solid fa-phone"></i> 1900 1234</p>
                    <p><i className="fa-solid fa-envelope"></i> support@workspace.vn</p>
                    <p><i className="fa-solid fa-location-dot"></i> Tòa nhà ABC, TP.HCM</p>
                </div>
            </div>
            {/* Bottom */}
            <div className="footer-bottom">
                © 2026 WorkSpace. Tất cả quyền được bảo lưu.
            </div>
        </footer>
    );
};

export default Footer;