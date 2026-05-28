import axiosInstance from './axiosInstance';

const BASE = '/bookings';

/** Lấy slot status cho phòng theo ngày (public) */
export const getSlotStatus = (roomId, date) =>
    axiosInstance.get(`${BASE}/slots`, { params: { roomId, date } })
        .then(r => r.data.data);

/** Tạo booking mới (yêu cầu đăng nhập) */
export const createBooking = (payload) =>
    axiosInstance.post(BASE, payload).then(r => r.data.data);

/** Lịch sử booking của user hiện tại */
export const getMyBookings = (page = 0, size = 10) =>
    axiosInstance.get(`${BASE}/my-bookings`, { params: { page, size } })
        .then(r => r.data.data);

// ─── Admin ──────────────────────────────────────────────────────────────────

/** Admin: lấy toàn bộ booking */
export const adminGetAllBookings = (params = {}) =>
    axiosInstance.get('/admin/bookings', { params }).then(r => r.data.data);

/** Admin: hủy booking */
export const adminCancelBooking = (id) =>
    axiosInstance.put(`/admin/bookings/${id}/cancel`).then(r => r.data.data);

/** Admin: xác nhận thanh toán */
export const adminConfirmBooking = (id) =>
    axiosInstance.put(`/admin/bookings/${id}/confirm`).then(r => r.data.data);

/** Admin: lấy tất cả phòng */
export const adminGetAllRooms = () =>
    axiosInstance.get('/admin/rooms').then(r => r.data.data);

/** Admin: lấy thống kê tổng quan hôm nay (fixed: was /admin/stats/today) */
export const adminGetTodayStats = () =>
    axiosInstance.get('/admin/dashboard/tong-quan').then(r => r.data.data);
