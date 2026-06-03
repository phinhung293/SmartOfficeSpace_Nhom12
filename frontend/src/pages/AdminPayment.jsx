import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import "./css/AdminPayment.css";

// ── Helpers ────────────────────────────────────────────────────────────────
const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

const fmtDateTime = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('vi-VN') + ' ' +
        d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('vi-VN');
};

const fmtTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const PAYMENT_STATUS = {
    CONFIRMED: { label: 'Đã thanh toán', color: '#16a34a', bg: '#dcfce7' },
    PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7' },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
    EXPIRED: { label: 'Hết hạn', color: '#94a3b8', bg: '#f1f5f9' },
    REFUNDED: { label: 'Hoàn tiền', color: '#8b5cf6', bg: '#ede9fe' },
};

const PayBadge = ({ status }) => {
    const s = PAYMENT_STATUS[status] || {
        label: status,
        color: '#64748b',
        bg: '#f1f5f9'
    };

    return (
        <span
            className="pay-badge"
            style={{
                background: s.bg,
                color: s.color
            }}
        >
            {s.label}
        </span>
    );
};

const genPayId = (bookingCode, idx) => {
    if (!bookingCode) return `PAY${String(idx + 1).padStart(7, '0')}`;
    return 'PAY' + bookingCode.replace(/^BK/, '');
};

const genTxn = (bookingCode) => {
    if (!bookingCode) return '—';
    return 'TXN' + bookingCode.replace(/^BK/, '');
};

const payMethodLabel = (method) => {
    if (!method) return 'Tiền mặt';

    const m = method.toUpperCase();

    if (m.includes('MOMO') || m.includes('SEPAY')) return 'Ví MoMo';
    if (m.includes('BANK') || m.includes('TRANSFER')) return 'Chuyển khoản';
    if (m.includes('CASH')) return 'Tiền mặt';

    return method;
};

const AdminPayment = () => {
    const [filterPayId, setFilterPayId] = useState('');
    const [filterBookId, setFilterBookId] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [allBookings, setAllBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/admin/bookings', {
                params: {
                    page: 0,
                    size: 200,
                    sort: 'startTime,desc'
                }
            });

            const data = res.data?.data;
            const content = data?.content || data || [];
            setAllBookings(content);
        } catch (err) {
            setError('Không thể tải dữ liệu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        const payRows = allBookings.map((b, idx) => ({
            paymentId: genPayId(b.bookingCode, idx),
            bookingId: b.bookingCode || b.bookingId,
            customerName: b.userName || '—',
            roomName: b.roomName || '—',
            amount: b.totalAmount || 0,
            paymentMethod: payMethodLabel(b.paymentMethod),
            status: b.status,
            paymentDate: b.status === 'CONFIRMED' ? (b.updatedAt || b.startTime) : null,
            bookingData: b // Lưu toàn bộ dữ liệu booking để hiển thị chi tiết
        }));
        setPayments(payRows);
    }, [allBookings]);

    useEffect(() => {
        let rows = [...payments];

        if (filterPayId.trim()) {
            rows = rows.filter(r =>
                r.paymentId.toLowerCase().includes(filterPayId.toLowerCase())
            );
        }

        if (filterBookId.trim()) {
            rows = rows.filter(r =>
                r.bookingId.toLowerCase().includes(filterBookId.toLowerCase())
            );
        }

        if (filterCustomer.trim()) {
            rows = rows.filter(r =>
                r.customerName.toLowerCase().includes(filterCustomer.toLowerCase())
            );
        }

        if (filterStatus) {
            rows = rows.filter(r => r.status === filterStatus);
        }

        setFiltered(rows);
        setTotalItems(rows.length);
        setPage(1); // Reset về trang 1 khi filter thay đổi
    }, [payments, filterPayId, filterBookId, filterCustomer, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleViewDetail = (payment) => {
        setSelectedPayment(payment);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPayment(null);
    };

    if (loading) {
        return (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: '#003db5' }}></i>
                <p style={{ marginTop: 16, color: '#64748b' }}>Đang tải dữ liệu thanh toán...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 32, color: '#ef4444' }}></i>
                <p style={{ marginTop: 16, color: '#ef4444' }}>{error}</p>
                <button onClick={fetchBookings} style={{ marginTop: 16, padding: '8px 20px', background: '#003db5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="admin-payment-container">
            {/* Modal chi tiết thanh toán */}
            {showModal && selectedPayment && (
                <div className="payment-modal-overlay" onClick={closeModal}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="payment-modal-header">
                            <h3>Chi tiết thanh toán</h3>
                            <button className="payment-modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="payment-modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Payment ID:</span>
                                <span className="detail-value">{selectedPayment.paymentId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Booking ID:</span>
                                <span className="detail-value">{selectedPayment.bookingId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Khách hàng:</span>
                                <span className="detail-value">{selectedPayment.customerName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phòng:</span>
                                <span className="detail-value">{selectedPayment.roomName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Số tiền:</span>
                                <span className="detail-value">{vnd(selectedPayment.amount)}đ</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phương thức:</span>
                                <span className="detail-value">{selectedPayment.paymentMethod}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái:</span>
                                <span className="detail-value"><PayBadge status={selectedPayment.status} /></span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ngày thanh toán:</span>
                                <span className="detail-value">{selectedPayment.paymentDate ? fmtDateTime(selectedPayment.paymentDate) : '—'}</span>
                            </div>
                            {selectedPayment.bookingData && (
                                <>
                                    <div className="detail-section-divider" />
                                    <div className="detail-row">
                                        <span className="detail-label">Thời gian đặt:</span>
                                        <span className="detail-value">
                                            {fmtDate(selectedPayment.bookingData.startTime)} - {fmtTime(selectedPayment.bookingData.startTime)} → {fmtTime(selectedPayment.bookingData.endTime)}
                                        </span>
                                    </div>
                                    {selectedPayment.bookingData.userEmail && (
                                        <div className="detail-row">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{selectedPayment.bookingData.userEmail}</span>
                                        </div>
                                    )}
                                    {selectedPayment.bookingData.userPhone && (
                                        <div className="detail-row">
                                            <span className="detail-label">SĐT:</span>
                                            <span className="detail-value">{selectedPayment.bookingData.userPhone}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="admin-payment-main">
                {/* Filter Section */}
                <div className="card">
                    <div className="section-header">
                        <h2 className="section-title">
                            <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: 8, color: '#003db5' }}></i>
                            Quản lý Thanh toán & Hóa đơn
                        </h2>
                        <div className="stats-badge">
                            Tổng số: {totalItems} giao dịch
                        </div>
                    </div>

                    <div className="filter-grid">
                        <div className="filter-item">
                            <label>Payment ID</label>
                            <input
                                className="input"
                                placeholder="Tìm theo mã thanh toán..."
                                value={filterPayId}
                                onChange={(e) => setFilterPayId(e.target.value)}
                            />
                        </div>

                        <div className="filter-item">
                            <label>Booking ID</label>
                            <input
                                className="input"
                                placeholder="Tìm theo mã đặt phòng..."
                                value={filterBookId}
                                onChange={(e) => setFilterBookId(e.target.value)}
                            />
                        </div>

                        <div className="filter-item">
                            <label>Khách hàng</label>
                            <input
                                className="input"
                                placeholder="Tìm theo tên khách hàng..."
                                value={filterCustomer}
                                onChange={(e) => setFilterCustomer(e.target.value)}
                            />
                        </div>

                        <div className="filter-item">
                            <label>Trạng thái</label>
                            <select
                                className="input"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="CONFIRMED">Đã thanh toán</option>
                                <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                                <option value="CANCELLED">Đã hủy</option>
                                <option value="EXPIRED">Hết hạn</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="card mt-20">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <i className="fa-regular fa-receipt" style={{ fontSize: 48, color: '#cbd5e1' }}></i>
                            <p>Không tìm thấy giao dịch nào</p>
                            <button onClick={() => {
                                setFilterPayId('');
                                setFilterBookId('');
                                setFilterCustomer('');
                                setFilterStatus('');
                            }} className="clear-filter-btn">
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="payment-table">
                                    <thead>
                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Booking ID</th>
                                            <th>Khách hàng</th>
                                            <th>Phòng</th>
                                            <th>Số tiền</th>
                                            <th>Thanh toán</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày TT</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRows.map((row) => (
                                            <tr key={row.paymentId}>
                                                <td className="payment-id">{row.paymentId}</td>
                                                <td>{row.bookingId}</td>
                                                <td>{row.customerName}</td>
                                                <td>{row.roomName}</td>
                                                <td className="amount">{vnd(row.amount)}đ</td>
                                                <td>{row.paymentMethod}</td>
                                                <td><PayBadge status={row.status} /></td>
                                                <td>{row.paymentDate ? fmtDateTime(row.paymentDate) : '—'}</td>
                                                <td>
                                                    <button 
                                                        className="view-detail-btn"
                                                        onClick={() => handleViewDetail(row)}
                                                    >
                                                        <i className="fa-regular fa-eye"></i> Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button 
                                        className="page-btn"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <div className="page-numbers">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                                if (i === 4) pageNum = '...';
                                            } else if (page >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                                if (i === 0) pageNum = '...';
                                            } else {
                                                pageNum = page - 2 + i;
                                                if (i === 0) pageNum = '...';
                                                if (i === 4) pageNum = '...';
                                            }
                                            if (pageNum === '...') {
                                                return <span key={i} className="page-dots">...</span>;
                                            }
                                            return (
                                                <button
                                                    key={i}
                                                    className={`page-num ${pageNum === page ? 'active' : ''}`}
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        className="page-btn"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPayment;