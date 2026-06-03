import React from 'react';

const Profile = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Thông tin cá nhân</h1>
            {user ? (
                <div>
                    <p><strong>Họ tên:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Vai trò:</strong> {user.role}</p>
                </div>
            ) : (
                <p>Vui lòng đăng nhập để xem thông tin.</p>
            )}
        </div>
    );
};

export default Profile;