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
  
  // Lấy chi tiết booking - dùng endpoint đúng
  getBookingDetail: (bookingId) =>
    axiosInstance.get(`/bookings/${bookingId}`).then(r => r.data.data),
};

export const { 
  createQRPayment, 
  getPaymentStatus, 
  confirmPayment, 
  simulatePayment, 
  getBookingDetail
} = paymentApi;

export default paymentApi;