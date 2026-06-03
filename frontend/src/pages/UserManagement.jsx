import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './css/Admin.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // State Lọc
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // State Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', status: 'ACTIVE' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', user: null });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get('/admin/users'); 
            setUsers(res.data.data || []);
        } catch (error) {
            showNotification("Lỗi khi tải dữ liệu!", "error");
        }
    };

    const showNotification = (msg, type) => {
        setNotification({ show: true, message: msg, type: type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const filteredUsers = users.filter(user => {
        const matchSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.phone?.includes(searchTerm);
        const matchRole = roleFilter === 'ALL' || user.role?.roleName?.toUpperCase() === roleFilter;
        const matchStatus = statusFilter === 'ALL' || user.status?.toUpperCase() === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    const handleSaveNew = async () => {
        if (!newUser.name || !newUser.email || !newUser.phone) return showNotification("Vui lòng nhập đủ thông tin bắt buộc!", "error");
        setIsLoading(true);
        try {
            await axiosInstance.post(`/admin/users`, newUser);
            showNotification("Thêm người dùng thành công!", "success");
            setIsAddModalOpen(false); setNewUser({ name: '', email: '', phone: '', status: 'ACTIVE' }); fetchUsers();
        } catch (error) { showNotification(error.response?.data?.message || "Lỗi khi thêm mới!", "error"); } 
        finally { setIsLoading(false); }
    };

    const handleSaveEdit = async () => {
        setIsLoading(true);
        try {
            await axiosInstance.put(`/admin/users/${editingUser.userId}`, editingUser);
            showNotification("Cập nhật thành công!", "success");
            setIsEditModalOpen(false); fetchUsers(); 
        } catch (error) { showNotification("Lỗi khi cập nhật!", "error"); } 
        finally { setIsLoading(false); }
    };

    const executeConfirmAction = async () => {
        setIsLoading(true);
        try {
            if (confirmModal.type === 'lock') {
                await axiosInstance.put(`/admin/users/${confirmModal.user.userId}/toggle`);
                showNotification("Cập nhật trạng thái thành công!", "success");
            } else {
                await axiosInstance.delete(`/admin/users/${confirmModal.user.userId}`);
                showNotification("Xóa người dùng thành công!", "success");
            }
            setConfirmModal({ isOpen: false, type: '', user: null }); fetchUsers();
        } catch (error) { showNotification("Đã có lỗi xảy ra!", "error"); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="admin-page-container" style={{ position: 'relative' }}>
            
            {notification.show && (
                <div style={{ position: 'absolute', top: '10px', right: '30px', zIndex: 1000, padding: '12px 20px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', background: notification.type === 'success' ? '#10b981' : '#ef4444', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'slideDown 0.3s' }}>
                    <i className={`fa-solid ${notification.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    {notification.message}
                </div>
            )}

            <h2 className="admin-page-title">Danh sách người dùng</h2>

            <div className="toolbar">
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Tìm kiếm tên, email, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="ALL">Tất cả quyền</option><option value="ADMIN">Admin</option><option value="CUSTOMER">Customer</option>
                </select>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động (Active)</option><option value="LOCKED">Bị khóa (Locked)</option>
                </select>
                <button className="btn-add-user" onClick={() => setIsAddModalOpen(true)}>
                    <i className="fa-solid fa-plus"></i> Thêm người dùng
                </button>
            </div>

            <div className="table-container" style={{marginTop: '20px'}}>
                <table className="admin-table">
                    <thead>
                        <tr><th>ID</th><th>Họ và tên</th><th>Email</th><th>Số điện thoại</th><th>Quyền</th><th>Trạng thái</th><th>Ngày tạo</th><th style={{textAlign: 'center'}}>Thao tác</th></tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.userId}>
                                <td>{user.userId}</td>
                                <td><div className="user-name-cell"><div className="mini-avatar"><i className="fa-regular fa-user"></i></div>{user.name}</div></td>
                                <td>{user.email}</td><td>{user.phone || 'Chưa cập nhật'}</td>
                                <td><span className={`role-badge ${user.role?.roleName?.toUpperCase() === 'ADMIN' ? 'role-admin' : 'role-customer'}`}>{user.role?.roleName?.toUpperCase() || 'CUSTOMER'}</span></td>
                                <td><span className={`status-badge ${user.status?.toUpperCase() === 'ACTIVE' ? 'status-active' : 'status-locked'}`}>{user.status?.toUpperCase() || 'ACTIVE'}</span></td>
                                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                <td style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', height: '100%', minHeight: '60px'}}>
                                    <button className="action-btn" onClick={() => { setEditingUser({...user}); setIsEditModalOpen(true); }}><i className="fa-solid fa-pen" style={{color: '#0b57ff'}}></i></button>
                                    <button className="action-btn" onClick={() => setConfirmModal({ isOpen: true, type: 'lock', user: user })}><i className={`fa-solid ${user.status?.toUpperCase() === 'ACTIVE' ? 'fa-lock-open' : 'fa-lock'}`} style={{color: user.status?.toUpperCase() === 'ACTIVE' ? '#059669' : '#f59e0b'}}></i></button>
                                    <button className="action-btn" onClick={() => setConfirmModal({ isOpen: true, type: 'delete', user: user })}><i className="fa-solid fa-trash" style={{color: '#ef4444'}}></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Thêm Mới */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Thêm người dùng mới</h3><button className="btn-close" onClick={() => setIsAddModalOpen(false)}><i className="fa-solid fa-xmark"></i></button></div>
                        <div className="modal-grid">
                            <div>
                                <div className="form-group"><label>Họ và tên *</label><input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} /></div>
                                <div className="form-group" style={{marginTop: '15px'}}><label>Số điện thoại *</label><input type="text" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} /></div>
                            </div>
                            <div>
                                <div className="form-group"><label>Địa chỉ Email *</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} /></div>
                                <div className="form-group" style={{marginTop: '15px'}}><label>Trạng thái</label><select value={newUser.status} onChange={(e) => setNewUser({...newUser, status: e.target.value})}><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option></select></div>
                            </div>
                        </div>
                        <p style={{fontSize: '12px', color: '#6b7280', marginTop: '15px'}}>* Mật khẩu mặc định: <strong>User@123456</strong></p>
                        <div className="modal-footer"><button className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Hủy</button><button className="btn-save" onClick={handleSaveNew} disabled={isLoading}>Thêm mới</button></div>
                    </div>
                </div>
            )}

            {/* Modal Chỉnh Sửa */}
            {isEditModalOpen && editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Chỉnh sửa người dùng</h3><button className="btn-close" onClick={() => setIsEditModalOpen(false)}><i className="fa-solid fa-xmark"></i></button></div>
                        <div className="modal-grid">
                            <div>
                                <div className="form-group"><label>Họ và tên</label><input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} /></div>
                                <div className="form-group" style={{marginTop: '15px'}}><label>Số điện thoại</label><input type="text" value={editingUser.phone} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} /></div>
                                <div className="form-group" style={{marginTop: '15px'}}><label>Trạng thái</label><select value={editingUser.status} onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option></select></div>
                            </div>
                            <div>
                                <div className="form-group"><label>Email</label><input type="email" value={editingUser.email} disabled /></div>
                                <div className="form-group" style={{marginTop: '15px'}}><label>Quyền</label><input type="text" value={editingUser.role?.roleName || 'CUSTOMER'} disabled /></div>
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button><button className="btn-save" onClick={handleSaveEdit} disabled={isLoading}>Lưu thay đổi</button></div>
                    </div>
                </div>
            )}

            {/* Modal Xác Nhận (Khóa/Xóa) */}
            {confirmModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-confirm-content">
                        <div className={`confirm-icon ${confirmModal.type === 'delete' ? 'icon-warning' : 'icon-lock'}`}>
                            <i className={`fa-solid ${confirmModal.type === 'delete' ? 'fa-triangle-exclamation' : 'fa-lock'}`}></i>
                        </div>
                        <h3>{confirmModal.type === 'delete' ? 'Xóa người dùng' : 'Khóa tài khoản'}</h3>
                        <p>{confirmModal.type === 'delete' ? 'Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.' : 'Người dùng sẽ bị chặn đăng nhập.'}</p>
                        <div className="user-target-info">
                            <div className="mini-avatar" style={{background: '#e5e7eb'}}><i className="fa-regular fa-user"></i></div>
                            <div><div style={{fontWeight: '600'}}>{confirmModal.user.name}</div><div style={{fontSize: '12px'}}>{confirmModal.user.email}</div></div>
                        </div>
                        <div className="confirm-actions">
                            <button className="btn-cancel-large" onClick={() => setConfirmModal({isOpen: false, type: '', user: null})}>Hủy</button>
                            <button className={confirmModal.type === 'delete' ? 'btn-danger' : 'btn-warning'} onClick={executeConfirmAction} disabled={isLoading}>
                                {confirmModal.type === 'delete' ? 'Xóa' : 'Khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;