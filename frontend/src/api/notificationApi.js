import axiosInstance from './axiosInstance';

const notificationApi = {
    getAll: () => axiosInstance.get('/notifications'),

    getUnreadCount: () =>
        axiosInstance.get('/notifications/unread-count'),

    markRead: (id) =>
        axiosInstance.put(`/notifications/${id}/read`),

    markAllRead: () =>
        axiosInstance.put('/notifications/read-all'),

    // lấy chi tiết 1 thông báo
    getOne: (id) =>
        axiosInstance.get(`/notifications/${id}`),

    // lấy thông báo liên quan
    getRelated: (id) =>
        axiosInstance.get(`/notifications/${id}/related`),

    // ── ADMIN ──────────────────────────────────────────────
    adminGetAll: (page = 0, size = 20) =>
        axiosInstance.get(`/admin/notifications?page=${page}&size=${size}`),

    adminGetUnreadCount: () =>
        axiosInstance.get('/admin/notifications/unread-count'),

    adminMarkAllRead: () =>
        axiosInstance.put('/admin/notifications/read-all'),

    adminGetSummary: () =>
        axiosInstance.get('/admin/notifications/summary'),

    adminSearch: (params) => {
        const q = new URLSearchParams();
        if (params.keyword)  q.append('keyword',  params.keyword);
        if (params.type)     q.append('type',     params.type);
        if (params.dateFrom) q.append('dateFrom', params.dateFrom);
        if (params.dateTo)   q.append('dateTo',   params.dateTo);
        q.append('page', params.page ?? 0);
        q.append('size', params.size ?? 10);
        return axiosInstance.get(`/admin/notifications/search?${q.toString()}`);
    },
};



export default notificationApi;