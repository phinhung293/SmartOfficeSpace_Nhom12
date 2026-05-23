import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './css/UserDashboard.css';

const ProfileInfo = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const fileInputRef = useRef(null);
    // State lưu dữ liệu hiển thị
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        createdAt: '',
        avatar: null
    });

    // Hàm lấy dữ liệu khi vừa vào trang
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Chỉ cần gõ từ phần sau /api trở đi
            const res = await axiosInstance.get('/users/profile'); 
            
            console.log("✅ DỮ LIỆU TỪ BACKEND TRẢ VỀ:", res.data); // Để dành soi data
            
            const data = res.data.data;
            setProfile({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '', 
                gender: data.gender || '',
                createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '',
                avatar: data.avatar || null
            });
        } catch (error) {
            console.error("❌ LỖI GỌI API PROFILE:", error); 
        }
    };

    // Hàm bắt sự kiện gõ chữ
    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    // Hàm Lưu thay đổi
    const handleSave = async () => {
        setIsLoading(true);
        try {
            await axiosInstance.put('/users/profile', {
                name: profile.name,
                phone: profile.phone,
                gender: profile.gender,
                dateOfBirth: profile.dateOfBirth
            });
            setIsEditing(false); // Đổi xong thì tắt form Edit đi
            setSuccessMsg("Cập nhật thông tin thành công!");
            setTimeout(() => setSuccessMsg(""), 8000);
            // Cập nhật lại tên trong localStorage để Header đổi tên theo
            const currentUser = JSON.parse(localStorage.getItem('user'));
            currentUser.name = profile.name;
            localStorage.setItem('user', JSON.stringify(currentUser));
            window.location.reload(); 
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi cập nhật!");
        } finally {
            setIsLoading(false);
        }
    };
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Giới hạn 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert("File ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
            return;
        }

        // Chuyển ảnh thành chuỗi Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Image = reader.result;
            
            try {
                // Gọi API để lưu chuỗi này xuống Backend
                await axiosInstance.put('/users/avatar', { avatar: base64Image });
                
                // Cập nhật ngay lập tức lên màn hình
                setProfile(prev => ({ ...prev, avatar: base64Image }));
                setSuccessMsg("Cập nhật ảnh đại diện thành công!");
                setTimeout(() => setSuccessMsg(""), 8000);
                
            } catch (err) {
                alert("Lỗi khi tải ảnh lên!");
            }
        };
    };
    return (
        <div className="profile-info-container">
            <h2 className="page-title">{isEditing ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}</h2>
            {successMsg && (
                <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #34d399', fontWeight: '500' }}>
                    <i className="fa-solid fa-circle-check"></i> {successMsg}
                </div>
            )}
            <div className="profile-grid">
                {/* CỘT TRÁI: AVATAR */}
                <div className="avatar-section">
                    <div className="avatar-circle">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Avatar" />
                        ) : (
                            <i className="fa-regular fa-user"></i>
                        )}
                    </div>
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        style={{ display: 'none' }} 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {/* NÚT BẤM KÍCH HOẠT INPUT */}
                    <button className="btn-outline-primary mt-3" onClick={handleAvatarClick}>
                        <i className="fa-regular fa-image"></i> Thay đổi ảnh
                    </button>
                    <p className="hint-text">JPG, PNG tối đa 2MB</p>

                    {!isEditing && (
                        <div className="action-buttons-vertical mt-4">
                            <button className="btn-outline-primary" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
                            
                            {/* GẮN LINK CHUYỂN TRANG ĐỔI MẬT KHẨU */}
                            <button 
                                className="btn-outline-secondary mt-2" 
                                onClick={() => navigate('/profile/change-password')}
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: FORM THÔNG TIN */}
                <div className="form-section">
                    <div className="info-row">
                        <label>Họ và tên</label>
                        {isEditing ? (
                            <input type="text" name="name" value={profile.name} onChange={handleChange} className="form-input" />
                        ) : (
                            <div className="info-value">{profile.name}</div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Email</label>
                        {/* Email KHÔNG cho phép sửa */}
                        <div className="info-value">{profile.email}</div> 
                    </div>

                    <div className="info-row">
                        <label>Số điện thoại</label>
                        {isEditing ? (
                            <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="form-input" maxLength="10"/>
                        ) : (
                            <div className="info-value">{profile.phone || 'Chưa cập nhật'}</div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Ngày sinh</label>
                        {isEditing ? (
                            <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleChange} className="form-input" />
                        ) : (
                            <div className="info-value">
                                {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Giới tính</label>
                        {isEditing ? (
                            <select name="gender" value={profile.gender} onChange={handleChange} className="form-input">
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        ) : (
                            <div className="info-value">{profile.gender || 'Chưa cập nhật'}</div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Ngày tham gia</label>
                        {/* Ngày tham gia KHÔNG cho phép sửa */}
                        <div className="info-value">{profile.createdAt}</div>
                    </div>

                    {/* NÚT LƯU HIỂN THỊ KHI ĐANG EDIT */}
                    {isEditing && (
                        <div className="action-buttons-horizontal mt-4">
                            <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                            <button className="btn-outline-secondary" onClick={() => setIsEditing(false)}>Hủy bỏ</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;