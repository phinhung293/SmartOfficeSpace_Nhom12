import axios from "axios";

const API_URL = "http://localhost:8080/api/rooms";

// Tìm kiếm / lọc phòng (POST với body filter)
export const searchRooms = async (searchData) => {
    const response = await axios.post(`${API_URL}/search`, searchData);
    return response.data;
};

// Lấy tất cả phòng không filter (gọi search với body rỗng)
export const getAllRooms = async (page = 0, size = 6, sortBy = "") => {
    const response = await axios.post(`${API_URL}/search`, { page, size, sortBy });
    return response.data;
};

// Lấy chi tiết phòng
export const getRoomDetail = async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}`);
    return response.data;
};

// Lấy trạng thái realtime
export const getRealtimeStatus = async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}/status`);
    return response.data;
};