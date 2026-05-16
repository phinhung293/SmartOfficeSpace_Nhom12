import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../pages/css/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");

        // Loại bỏ khoảng trắng thừa ở đầu/cuối dữ liệu nhập vào
        const loginData = {
            email: credentials.email.trim(),
            password: credentials.password.trim()
        };

        try {
            const res = await axiosInstance.post('/auth/login', loginData);
            
            // Dữ liệu trả về từ ApiResponse của bạn nằm ở res.data.data
            const userData = res.data.data; 
            
            // Lưu thông tin vào localStorage để duy trì phiên đăng nhập
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));

            // LOGIC CHUYỂN HƯỚNG TỰ ĐỘNG THEO QUYỀN (ROLE)
            if (userData.role === 'ADMIN') {
                navigate('/admin'); // Admin nhảy thẳng vào Dashboard quản trị
            } else {
                navigate('/'); // User thường về trang chủ đặt phòng
            }
            
            // Làm mới lại trạng thái ứng dụng để nhận Header mới
            window.location.reload();

        } catch (error) {
            // Hiển thị lỗi đỏ mượt mà lên khung báo lỗi
            setLoginError(error.response?.data?.message || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại!");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="lang-toggle-top">
                   <button className="lang-btn"><i className="fa-solid fa-globe"></i> VI <i className="fa-solid fa-chevron-down"></i></button>
                </div>

                <h1>Chào mừng trở lại!</h1>
                <p className="subtitle">Vui lòng đăng nhập vào tài khoản của bạn để tiếp tục.</p>

                {/* Khung thông báo lỗi đỏ nhạt đồng bộ với mẫu thiết kế */}
                {loginError && <div className="alert-error">{loginError}</div>}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Địa chỉ email</label>
                        <div className="input-wrapper">
                            <i className="fa-regular fa-envelope prefix-icon"></i>
                            <input 
                                type="email" 
                                placeholder="Nhập email của bạn" 
                                onChange={(e) => setCredentials({...credentials, email: e.target.value})} 
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="label-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <label>Mật khẩu</label>
                            <a href="#" className="forgot-pass" style={{fontSize: '13px', color: '#0b57ff', textDecoration: 'none'}}>Quên mật khẩu?</a>
                        </div>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock prefix-icon"></i>
                            <input 
                                type={showPass ? "text" : "password"} 
                                placeholder="Nhập mật khẩu của bạn" 
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})} 
                                required
                            />
                            {/* Icon mắt ẩn hiện mật khẩu */}
                            <i className={`fa-solid ${showPass ? 'fa-eye' : 'fa-eye-slash'} eye-icon`} 
                               onClick={() => setShowPass(!showPass)}></i>
                        </div>
                    </div>

                    {/* Checkbox ghi nhớ đăng nhập giống hệt mẫu Hình 1 */}
                    <div className="checkbox-group">
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
                    </div>

                    <button type="submit" className="auth-btn">Đăng nhập</button>
                </form>

                <div className="divider">Hoặc tiếp tục với</div>
                
                <button className="google-btn" type="button">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" />
                    Google
                </button>

                <p className="footer-text">
                    Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;