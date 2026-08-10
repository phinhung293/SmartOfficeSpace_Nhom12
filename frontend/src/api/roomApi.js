import axiosInstance from './axiosInstance';

// Tìm kiếm / lọc phòng
export const searchRooms = async (searchData) => {
    const response = await axiosInstance.post(
        '/rooms/search',
        searchData
    );

    return response.data;
};

// Lấy tất cả phòng
export const getAllRooms = async (
    page = 0,
    size = 6,
    sortBy = ""
) => {
    const response = await axiosInstance.post(
        '/rooms/search',
        {
            page,
            size,
            sortBy
        }
    );

    return response.data;
};

// Lấy chi tiết phòng
export const getRoomDetail = async (roomId) => {
    const response = await axiosInstance.get(
        `/rooms/${roomId}`
    );

    return response.data;
};

// Lấy trạng thái realtime
export const getRealtimeStatus = async (roomId) => {
    const response = await axiosInstance.get(
        `/rooms/${roomId}/status`
    );

    return response.data;
};