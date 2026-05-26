import React from 'react';
import './css/PublicPages.css';

const Contact = () => {
    return (
        <div className="public-page-container">

            <div className="contact-wrapper">
                {/* Cột trái: Thông tin */}
                <div className="contact-info-card">
                    <h3>Thông tin liên hệ</h3>
                    
                    <div className="info-item">
                        <i className="fa-solid fa-location-dot"></i>
                        <div>
                            <h4>Địa chỉ</h4>
                            <p>Trường đại học Công Nghệ Sài Gòn</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <i className="fa-solid fa-phone"></i>
                        <div>
                            <h4>Hotline</h4>
                            <p>1900 1234</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <i className="fa-solid fa-envelope"></i>
                        <div>
                            <h4>Email</h4>
                            <p>support@workspace.vn</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <i className="fa-solid fa-clock"></i>
                        <div>
                            <h4>Giờ làm việc</h4>
                            <p>9:00 - 22:00</p>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Form */}
                <div className="contact-form-card">
                    <div className="form-header">
                        <h3>Gửi tin nhắn cho chúng tôi</h3>
                        <button className="btn-submit">Gửi</button>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input type="text" placeholder="Nhập họ và tên của bạn" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="Nhập email của bạn" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Số điện thoại</label>
                        <input type="text" placeholder="Nhập số điện thoại của bạn" />
                    </div>

                    <div className="form-group">
                        <label>Nội dung cần hỗ trợ</label>
                        <textarea rows="5" placeholder="Nhập nội dung bạn cần hỗ trợ"></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;