import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../pages/css/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // Thêm state này để lưu lỗi hiện lên khung đỏ
    const [generalError, setGeneralError] = useState("");
    
    const [formData, setFormData] = useState({ 
        name: '', email: '', phone: '', password: '', confirmPassword: '', agreed: false 
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Xóa lỗi khi người dùng bắt đầu nhập lại
        if (generalError) setGeneralError("");
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setGeneralError("");

    // 1. Kiểm tra định dạng số điện thoại (Chỉ 10 chữ số)
    const phoneRegex = /^\d{10}$/; 
    if (!phoneRegex.test(formData.phone)) {
        setGeneralError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số!");
        return;
    }
    // 1. Kiểm tra định dạng mật khẩu (8+ ký tự, 1 chữ, 1 số, 1 ký tự đặc biệt)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    
    if (!passwordRegex.test(formData.password)) {
        setGeneralError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ cái, số và ký tự đặc biệt!");
        return;
    }

    // 2. Kiểm tra khớp mật khẩu
    if (formData.password !== formData.confirmPassword) {
            setGeneralError("Mật khẩu xác nhận không khớp. Vui lòng nhập lại!");
            return;
        }
        // Kiểm tra đồng ý điều khoản
        if(!formData.agreed) {
            setGeneralError("Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục.");
            return;
        }

        // Kiểm tra khớp mật khẩu
        if(formData.password !== formData.confirmPassword) {
            setGeneralError("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
            return;
        }
        
        try {
            const res = await axiosInstance.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            if(res.data.success) {
                navigate('/login');
            }
        } catch (error) {
            // Lấy lỗi từ Backend trả về (Ví dụ: Email đã tồn tại)
            const errorMsg = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
            setGeneralError(errorMsg);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="lang-toggle-top">
                   <button className="lang-btn"><i className="fa-solid fa-globe"></i> VI <i className="fa-solid fa-chevron-down"></i></button>
                </div>
                
                <h1>Tạo tài khoản</h1>
                <p className="subtitle">Hãy tham gia Smart Office Space và bắt đầu ngay!</p>

                {/* KHUNG BÁO LỖI HIỆN TẠI ĐÂY */}
                {generalError && (
                    <div className="alert-error">
                        {generalError}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label>Họ & tên</label>
                        <div className="input-wrapper">
                            <i className="fa-regular fa-user prefix-icon"></i>
                            <input name="name" type="text" placeholder="Nhập họ & tên của bạn" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <i className="fa-regular fa-envelope prefix-icon"></i>
                            <input name="email" type="email" placeholder="Nhập email của bạn" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Số điện thoại</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-phone prefix-icon"></i>
                            <input name="phone" type="text" placeholder="Nhập số điện thoại" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock prefix-icon"></i>
                            <input 
                                name="password"
                                type={showPass ? "text" : "password"} 
                                placeholder="Nhập mật khẩu" 
                                onChange={handleChange}
                                required
                            />
                            <i className={`fa-solid ${showPass ? 'fa-eye' : 'fa-eye-slash'} eye-icon`} 
                               onClick={() => setShowPass(!showPass)}></i>
                        </div>
                        <p className="hint">Phải có ít nhất 8 ký tự, bao gồm cả chữ cái, số và ký tự đặc biệt.</p>
                    </div>

                    <div className="input-group">
                        <label>Xác nhận mật khẩu</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock prefix-icon"></i>
                            <input 
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"} 
                                placeholder="Nhập lại mật khẩu" 
                                onChange={handleChange}
                                required
                            />
                            <i className={`fa-solid ${showConfirm ? 'fa-eye' : 'fa-eye-slash'} eye-icon`} 
                               onClick={() => setShowConfirm(!showConfirm)}></i>
                        </div>
                    </div>

                    <div className="checkbox-group">
                        <input name="agreed" type="checkbox" id="terms" checked={formData.agreed} onChange={handleChange} />
                        <label htmlFor="terms">
                            Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
                        </label>
                    </div>

                    <button type="submit" className="auth-btn">Tạo tài khoản</button>
                </form>

                <div className="divider">Hoặc đăng nhập bằng</div>
                <button className="google-btn" type="button">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" /> Google
                </button>
                <p className="footer-text">Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
            </div>
        </div>
    );
};

export default Register;