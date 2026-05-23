import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import OtpInput from 'react-otp-input';
import '../pages/css/Auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) return setError("Vui lòng nhập địa chỉ email!");
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axiosInstance.post('/auth/forgot-password/send-code', null, {
                params: { email: email }
            });
            setMessage(response.data.message || "Mã xác minh đã được gửi!");
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi gửi email. Vui lòng thử lại!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return setError("Mã OTP phải gồm 6 chữ số!");
        setIsLoading(true);
        setError('');
        try {
            await axiosInstance.post('/auth/forgot-password/verify-code', null, {
                params: { email: email, code: otp }
            });
            setError('');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Mã xác minh không hợp lệ hoặc đã hết hạn!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return setError("Mật khẩu chưa đạt yêu cầu bảo mật!");
        }
        if (newPassword !== confirmPassword) {
            return setError("Mật khẩu xác nhận không khớp!");
        }

        setIsLoading(true);
        setError('');
        try {
            await axiosInstance.post('/auth/forgot-password/reset', null, {
                params: { email: email, code: otp, newPassword: newPassword }
            });
            // ĐÃ SỬA: Xóa alert(), chuyển thẳng sang Màn hình thành công (Bước 4)
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu!");
        } finally {
            setIsLoading(false);
        }
    };

    // Style dùng chung cho Icon tròn to
    const bigIconStyle = {
        width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #0b57ff',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        margin: '0 auto 15px auto', fontSize: '24px', color: '#0b57ff'
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ position: 'relative', paddingTop: '20px' }}>
                
                {/* Header: Chỉ hiện thị Nút Back và Step khi chưa đến Bước 4 */}
                {step < 4 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <button onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)} 
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#333' }}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <span style={{ background: '#e0e7ff', color: '#0b57ff', padding: '5px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>
                            {step} / 3
                        </span>
                    </div>
                )}

                {error && <div className="alert-error" style={{marginBottom: '15px'}}>{error}</div>}
                {message && step === 2 && <div className="alert-error" style={{background: '#d1fae5', color: '#065f46', border: '1px solid #34d399', marginBottom: '15px'}}>{message}</div>}

                {/* ===================== MÀN HÌNH 1: NHẬP EMAIL ===================== */}
                {step === 1 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={bigIconStyle}>
                            <i className="fa-regular fa-envelope"></i>
                        </div>
                        <h2 style={{fontSize: '24px', marginBottom: '10px'}}>Quên mật khẩu?</h2>
                        <p className="subtitle" style={{marginBottom: '25px'}}>Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.</p>
                        
                        <div className="input-group" style={{ textAlign: 'left' }}>
                            <label>Địa chỉ email</label>
                            <div className="input-wrapper">
                                <i className="fa-regular fa-envelope prefix-icon"></i>
                                <input 
                                    type="email" 
                                    placeholder="Nhập email của bạn" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button onClick={handleSendCode} disabled={isLoading} className="auth-btn" style={{marginTop: '10px'}}>
                            {isLoading ? "Đang gửi..." : "Gửi mã xác minh"}
                        </button>

                        <p className="footer-text" style={{marginTop: '20px'}}>
                            Bạn nhớ mật khẩu? <Link to="/login" style={{color: '#0b57ff', fontWeight: 'bold', textDecoration: 'none'}}>Đăng nhập</Link>
                        </p>
                    </div>
                )}

                {/* ===================== MÀN HÌNH 2: NHẬP OTP ===================== */}
                {step === 2 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={bigIconStyle}>
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <h2 style={{fontSize: '24px', marginBottom: '10px'}}>Nhập mã xác minh</h2>
                        <p className="subtitle" style={{marginBottom: '20px'}}>Chúng tôi đã gửi mã gồm 6 chữ số đến<br/><b>{email}</b></p>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                            <OtpInput
                                value={otp}
                                onChange={setOtp}
                                numInputs={6}
                                renderSeparator={<span style={{ width: '10px' }}></span>}
                                shouldAutoFocus={true}
                                renderInput={(props) => <input {...props} />}
                                inputStyle={{
                                    width: '45px', height: '55px', fontSize: '24px', borderRadius: '8px',
                                    border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold',
                                    color: '#333', outlineColor: '#0b57ff', backgroundColor: 'transparent'
                                }}
                            />
                        </div>
                        
                        <div style={{ marginTop: '25px', fontSize: '14px', color: '#555' }}>
                            Không nhận được mã? <button onClick={handleSendCode} style={{ color: '#0b57ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>Gửi lại</button>
                        </div>

                        <button onClick={handleVerifyOtp} disabled={isLoading} className="auth-btn" style={{marginTop: '20px'}}>
                            {isLoading ? "Đang kiểm tra..." : "Xác minh mã"}
                        </button>
                    </div>
                )}

                {/* ===================== MÀN HÌNH 3: ĐỔI MẬT KHẨU ===================== */}
                {step === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={bigIconStyle}>
                            <i className="fa-solid fa-key"></i>
                        </div>
                        <h2 style={{fontSize: '24px', marginBottom: '10px'}}>Tạo mật khẩu mới</h2>
                        <p className="subtitle" style={{marginBottom: '25px'}}>Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.</p>
                        
                        <div className="input-group" style={{ textAlign: 'left' }}>
                            <label>Mật khẩu mới</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-lock prefix-icon"></i>
                                <input 
                                    type="password" 
                                    placeholder="********" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ textAlign: 'left', marginTop: '15px' }}>
                            <label>Xác nhận mật khẩu mới</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-lock prefix-icon"></i>
                                <input 
                                    type="password" 
                                    placeholder="********" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ textAlign: 'left', marginTop: '15px', fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                            <div style={{color: newPassword.length >= 8 ? '#10b981' : '#6b7280'}}><i className="fa-solid fa-check"></i> Ít nhất 8 ký tự</div>
                            <div style={{color: /(?=.*[A-Z])(?=.*\d)/.test(newPassword) ? '#10b981' : '#6b7280'}}><i className="fa-solid fa-check"></i> Một chữ cái viết hoa & Một chữ số</div>
                            <div style={{color: /(?=.*[@$!%*?&])/.test(newPassword) ? '#10b981' : '#6b7280'}}><i className="fa-solid fa-check"></i> Một ký tự đặc biệt</div>
                        </div>

                        <button onClick={handleResetPassword} disabled={isLoading} className="auth-btn" style={{marginTop: '20px'}}>
                            {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                        </button>
                    </div>
                )}

                {/* ===================== MÀN HÌNH 4: THÀNH CÔNG ===================== */}
                {step === 4 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{...bigIconStyle, color: '#10b981', borderColor: '#10b981', width: '80px', height: '80px', fontSize: '36px'}}>
                            <i className="fa-solid fa-check"></i>
                        </div>
                        <h2 style={{fontSize: '28px', marginBottom: '15px', color: '#111827'}}>Thành công!</h2>
                        <p className="subtitle" style={{marginBottom: '30px', fontSize: '16px'}}>Mật khẩu của bạn đã được đặt lại thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.</p>
                        
                        <button onClick={() => navigate('/login')} className="auth-btn">
                            Đăng nhập ngay
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ForgotPassword;