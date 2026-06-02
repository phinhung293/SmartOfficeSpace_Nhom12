import axiosInstance from "./axiosInstance";

// ─────────────────────────────────────────────────────────────
//  Helper: format date param → "YYYY-MM-DD"
//  Hỗ trợ cả JS Date thuần lẫn Day.js / Moment.js tránh crash UI
// ─────────────────────────────────────────────────────────────
const fmt = (date) => {
    if (!date) return undefined;
    if (typeof date === "string") return date;

    // Nếu là đối tượng của thư viện Day.js hoặc Moment.js
    if (typeof date.format === "function") {
        return date.format("YYYY-MM-DD");
    }

    // Nếu là JS Date Object thuần và hợp lệ
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
    }

    return undefined;
};

const buildParams = (fromDate, toDate) => {
    const params = {};
    const formattedFrom = fmt(fromDate);
    const formattedTo = fmt(toDate);

    if (formattedFrom) params.fromDate = formattedFrom;
    if (formattedTo) params.toDate = formattedTo;

    return params;
};

// ─────────────────────────────────────────────────────────────
//  REVENUE (DOANH THU)
// ─────────────────────────────────────────────────────────────
export const getRevenueByDay = (fromDate, toDate) =>
    axiosInstance.get("/reports/revenue/day", { params: buildParams(fromDate, toDate) });

export const getRevenueByMonth = (fromDate, toDate) =>
    axiosInstance.get("/reports/revenue/month", { params: buildParams(fromDate, toDate) });

export const getRevenueByYear = (fromDate, toDate) =>
    axiosInstance.get("/reports/revenue/year", { params: buildParams(fromDate, toDate) });

// ─────────────────────────────────────────────────────────────
//  BOOKING (ĐẶT PHÒNG / ĐẶT LỊCH)
// ─────────────────────────────────────────────────────────────
export const getBookingSummary = (fromDate, toDate) =>
    axiosInstance.get("/reports/bookings/summary", { params: buildParams(fromDate, toDate) });

export const getBookingByDay = (fromDate, toDate) =>
    axiosInstance.get("/reports/bookings/daily", { params: buildParams(fromDate, toDate) });

// ─────────────────────────────────────────────────────────────
//  OCCUPANCY (CÔNG SUẤT PHÒNG / MẬT ĐỘ)
// ─────────────────────────────────────────────────────────────
export const getOccupancyReport = (fromDate, toDate) =>
    axiosInstance.get("/reports/occupancy", { params: buildParams(fromDate, toDate) });

// ─────────────────────────────────────────────────────────────
//  EXPORT EXCEL (Gửi kèm Token qua axiosInstance để bảo mật)
// ─────────────────────────────────────────────────────────────
export const exportRevenueExcel = (fromDate, toDate) =>
    axiosInstance.get("/reports/export/revenue", {
        params: buildParams(fromDate, toDate),
        responseType: "blob",
    });

export const exportBookingExcel = (fromDate, toDate) =>
    axiosInstance.get("/reports/export/bookings", {
        params: buildParams(fromDate, toDate),
        responseType: "blob",
    });

export const exportOccupancyExcel = (fromDate, toDate) =>
    axiosInstance.get("/reports/export/occupancy", {
        params: buildParams(fromDate, toDate),
        responseType: "blob",
    });

// ─────────────────────────────────────────────────────────────
//  Helper: Tải file từ dữ liệu Blob (Xử lý an toàn)
// ─────────────────────────────────────────────────────────────
export const downloadBlob = (response, defaultFilename) => {
    // Đảm bảo không lỗi nếu response hoặc headers bị rỗng
    const headers = response?.headers || {};
    // Check cả chữ thường lẫn chữ hoa vì một số server cấu hình khác nhau
    const contentDisposition = headers["content-disposition"] || headers["Content-Disposition"] || "";

    let filename = defaultFilename;
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
        filename = match[1].replace(/['"]/g, "");
    }

    // Kiểm tra và khởi tạo dữ liệu Blob một cách an toàn
    const blobData = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
    const url = window.URL.createObjectURL(blobData);

    // Tạo thẻ <a> giả lập để kích hoạt download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Dọn dẹp DOM và giải phóng bộ nhớ browser sau khi tải hoàn tất
    link.remove();
    window.URL.revokeObjectURL(url);
};