import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './css/UserDashboard.css';

const ChangePassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const toggleShow = (field) => {
        setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
            return setError("Vui lòng điền đầy đủ các trường!");
        }
        if (!passwordRegex.test(formData.newPassword)) {
            return setError("Mật khẩu mới chưa đạt yêu cầu bảo mật!");
        }
        if (formData.newPassword !== formData.confirmPassword) {
            return setError("Mật khẩu xác nhận không khớp!");
        }

        setIsLoading(true);
        try {
            await axiosInstance.put('/users/change-password', formData);
            alert("Cập nhật mật khẩu thành công!");
            navigate('/profile/info'); 
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu!");
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm dùng chung để render các hàng input cho thẳng tắp
    const renderInputRow = (label, name, placeholder, showStateKey, helperText = null) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '18px' }}>
            <label style={{ 
                width: '220px', 
                minWidth: '220px',
                marginTop: '10px', 
                fontWeight: '500', 
                color: '#555' 
            }}>
                {label} <span style={{color: 'red'}}>*</span>
            </label>

            <div style={{ flexGrow: 1 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <input 
                        type={showPass[showStateKey] ? "text" : "password"} 
                        name={name} 
                        placeholder={placeholder} 
                        className="form-input" 
                        value={formData[name]} 
                        onChange={handleChange} 
                        style={{ 
                            width: '100%',
                            height: '42px', // Cố định chiều cao cho thanh mảnh
                            padding: '0 45px 0 15px',
                            boxSizing: 'border-box',
                            fontSize: '14px'
                        }}
                    />
                    {/* Con mắt CĂN GIỮA TUYỆT ĐỐI */}
                    <i className={`fa-solid ${showPass[showStateKey] ? 'fa-eye' : 'fa-eye-slash'}`} 
                       onClick={() => toggleShow(showStateKey)} 
                       style={{ 
                           position: 'absolute', 
                           right: '15px', 
                           top: '50%',
                           transform: 'translateY(-50%)', // Phép màu giúp con mắt luôn ở giữa
                           cursor: 'pointer', 
                           color: '#888',
                           fontSize: '16px'
                       }}></i>
                </div>
                {helperText && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', lineHeight: '1.5', maxWidth: '450px' }}>
                        {helperText}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="profile-info-container">
            <h2 className="page-title">Đổi mật khẩu</h2>

            {error && <div className="alert-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f87171', fontWeight: '500' }}><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

            <div className="security-notice" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f0f5ff', padding: '18px 20px', borderRadius: '8px', marginBottom: '30px' }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '26px', color: '#0b57ff' }}></i>
                <span style={{ color: '#0b57ff', fontWeight: '500', fontSize: '15px' }}>Vui lòng thay đổi mật khẩu mới để bảo mật tài khoản của bạn</span>
            </div>

            <div className="form-section" style={{ maxWidth: '750px' }}>
                
                {renderInputRow("Mật khẩu hiện tại", "oldPassword", "Nhập mật khẩu hiện tại", "old")}

                {renderInputRow(
                    "Mật khẩu mới", 
                    "newPassword", 
                    "Nhập mật khẩu mới", 
                    "new",
                    "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                )}

                {renderInputRow("Nhập lại mật khẩu mới", "confirmPassword", "Nhập lại mật khẩu mới", "confirm")}

                <div className="action-buttons-horizontal mt-4" style={{ paddingLeft: '220px', display: 'flex', gap: '15px' }}>
                    <button className="btn-primary" onClick={handleSubmit} disabled={isLoading} style={{ height: '42px', minWidth: '160px' }}>
                        {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                    </button>
                    <button className="btn-outline-secondary" onClick={() => navigate('/profile/info')} style={{ height: '42px' }}>
                        Hủy bỏ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;