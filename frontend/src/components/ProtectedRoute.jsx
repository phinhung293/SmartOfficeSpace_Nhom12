import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    // Lấy thông tin user từ máy người dùng
    const user = JSON.parse(localStorage.getItem('user'));

    // Nếu chưa đăng nhập hoặc không phải Admin thì đá về trang Login hoặc báo lỗi
    if (!user || user.role !== 'ADMIN') {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <h2 style={{ color: 'red' }}>Truy cập bị từ chối!</h2>
                <p>Bạn không có quyền quản trị để vào trang này.</p>
                <button 
                    className="login-btn" 
                    onClick={() => window.location.href = '/login'}
                    style={{ marginTop: '20px' }}
                >
                    Quay lại đăng nhập
                </button>
            </div>
        );
    }

    // Nếu đúng là Admin thì cho phép xem nội dung bên trong (children)
    return children;
};

export default ProtectedAdminRoute;