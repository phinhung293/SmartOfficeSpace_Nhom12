import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../pages/css/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Nhận thông báo đẩy từ các trang khác gửi sang (Ví dụ: từ trang Booking đá ra)
    const loginMessage = location.state?.message || null;

    const [showPass, setShowPass] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");

        // Chỉ loại bỏ khoảng trắng ở email, KHÔNG trim mật khẩu để tránh lỗi nếu pass có khoảng trắng cố ý
        const loginData = {
            email: credentials.email.trim(),
            password: credentials.password
        };

        try {
            const res = await axiosInstance.post('/auth/login', loginData);

            // Dữ liệu trả về từ ApiResponse nằm ở res.data.data
            const userData = res.data.data;

            // Lưu thông tin vào localStorage để duy trì phiên đăng nhập
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));

            // LOGIC CHUYỂN HƯỚNG: nếu có trang cần redirect quay lại (vd: từ trang booking) thì ưu tiên về đó
            const redirectTo = sessionStorage.getItem("redirectAfterLogin");
            sessionStorage.removeItem("redirectAfterLogin");

            if (redirectTo) {
                window.location.href = redirectTo;
                return;
            }

            // LOGIC CHUYỂN HƯỚNG TỰ ĐỘNG THEO QUYỀN (Sử dụng href để làm mới Header nhận token mới)
            if (userData.role === 'ADMIN') {
                window.location.href = '/admin'; // Admin nhảy vào Dashboard quản trị
            } else {
                window.location.href = '/'; // User thường quay về trang chủ đặt phòng
            }

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

                {/* Khung thông báo màu vàng nhạt khi bị điều hướng từ trang bảo mật (Nhánh booking bổ sung) */}
                {loginMessage && (
                    <div className="alert-error" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }}></i>
                        {loginMessage}
                    </div>
                )}

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
                                value={credentials.email}
                                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="label-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <label>Mật khẩu</label>

                            {/* Giữ nguyên thẻ Link điều hướng mượt mà không load trang của develop */}
                            <Link to="/forgot-password" className="forgot-pass" style={{fontSize: '13px', color: '#0b57ff', textDecoration: 'none'}}>
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-lock prefix-icon"></i>
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Nhập mật khẩu của bạn"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                required
                            />
                            {/* Icon mắt ẩn hiện mật khẩu */}
                            <i className={`fa-solid ${showPass ? 'fa-eye' : 'fa-eye-slash'} eye-icon`}
                               onClick={() => setShowPass(!showPass)}></i>
                        </div>
                    </div>

                    {/* Checkbox ghi nhớ đăng nhập giống hệt mẫu thiết kế */}
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