// ================== SỬA paymentApi.js ==================
// src/api/paymentApi.js
import axiosInstance from './axiosInstance';

const BASE = '/payments';

const paymentApi = {
  createQRPayment: (bookingId, paymentMethod = 'SEPAY') =>
    axiosInstance.post(`${BASE}/create-qr`, { bookingId, paymentMethod })
      .then(r => r.data.data),
  
  getPaymentStatus: (bookingId) =>
    axiosInstance.get(`${BASE}/status/${bookingId}`)
      .then(r => r.data.data),
  
  confirmPayment: (bookingId) =>
    axiosInstance.post(`${BASE}/confirm/${bookingId}`)
      .then(r => r.data),
  
  simulatePayment: (bookingId) =>
    axiosInstance.post(`${BASE}/simulate/${bookingId}`)
      .then(r => r.data),
  
  // ========== THÊM HÀM NÀY ==========
  // Lấy chi tiết booking từ bookingId (dùng cho BookingDetail)
  getBookingDetail: (bookingId) =>
    axiosInstance.get(`/bookings/${bookingId}`).then(r => r.data.data),
};

export const { 
  createQRPayment, 
  getPaymentStatus, 
  confirmPayment, 
  simulatePayment, 
  getBookingDetail   // THÊM DÒNG NÀY
} = paymentApi;

export default paymentApi;