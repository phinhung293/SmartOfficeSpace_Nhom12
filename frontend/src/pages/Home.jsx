import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchRooms } from '../api/roomApi';
import './css/Home.css';

// Chỉ lấy các tab có trong hệ thống hiện tại
const TABS = [
  { id: null, label: "Tất cả", icon: "fa-border-all" },
  { id: 1, label: "Phòng họp", icon: "fa-chalkboard-user" },
  { id: 2, label: "Phòng riêng", icon: "fa-door-closed" },
  { id: 3, label: "Coworking", icon: "fa-people-group" }
];

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null); // null = Tất cả
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms(activeTab);
  }, [activeTab]);

  const fetchRooms = async (workspaceTypeId) => {
    setLoading(true);
    try {
      // payload tương tự như Spaces.jsx nhưng giới hạn size = 4 để hiển thị trên trang chủ
      const payload = {
        workspaceTypeId: workspaceTypeId,
        size: 8, 
        page: 0
      };
      const res = await searchRooms(payload);
      setRooms(res.content || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng trang chủ:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Không gian lý tưởng <br />
            cho <span>mọi cuộc họp và sự kiện</span>
          </h1>
          <p className="hero-subtitle">
            Đặt phòng họp, không gian làm việc nhanh chóng tiện lợi với Smart Office Space
          </p>
          
          <div className="hero-features">
            <div className="hf-item">
              <div className="hf-icon"><i className="fa-solid fa-check-double"></i></div>
              <div className="hf-text">
                <h4>Xác nhận nhanh chóng</h4>
                <p>Đặt phòng dễ dàng</p>
              </div>
            </div>
            <div className="hf-item">
              <div className="hf-icon"><i className="fa-solid fa-sack-dollar"></i></div>
              <div className="hf-text">
                <h4>Không mất phí đặt cọc</h4>
                <p>Thanh toán linh hoạt</p>
              </div>
            </div>
            <div className="hf-item">
              <div className="hf-icon"><i className="fa-solid fa-headset"></i></div>
              <div className="hf-text">
                <h4>Hỗ trợ 24/7</h4>
                <p>Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <div className="hf-item">
              <div className="hf-icon"><i className="fa-solid fa-shield-halved"></i></div>
              <div className="hf-text">
                <h4>An toàn & bảo mật</h4>
                <p>Thông tin được bảo vệ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Spaces Discovery Section */}
      <section className="spaces-section">
        <div className="section-header">
          <h2>Khám phá không gian phù hợp</h2>
          <a href="/spaces" className="view-all-link" onClick={(e) => { e.preventDefault(); navigate('/spaces'); }}>
            Xem tất cả <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>

        <div className="tabs-wrapper">
          {TABS.map(tab => (
            <button 
              key={tab.id === null ? 'all' : tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>

        <div className="spaces-grid">
          {loading ? (
            <div className="loading-state">
              <i className="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách...
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              Không tìm thấy không gian phù hợp.
            </div>
          ) : (
            rooms.map(room => (
              <div key={room.roomId} className="h-room-card">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="h-rc-img" />
                ) : (
                  <div className="h-rc-placeholder"></div>
                )}
                <div className="h-rc-body">
                  <div className="h-rc-top">
                    <span className="h-rc-name">{room.name}</span>
                  </div>
                  <div className="h-rc-meta">
                    <span><i className="fa-regular fa-user"></i> {room.capacity} người</span>
                    <span>
                      <i className="fa-solid fa-tv"></i> 
                      {room.amenities && room.amenities.length > 0 
                        ? room.amenities.slice(0, 2).join(", ") + (room.amenities.length > 2 ? ",..." : "") 
                        : "Tiện ích cơ bản"}
                    </span>
                  </div>
                  <div className="h-rc-bottom">
                    <div className="h-rc-price">
                      {Number(room.price).toLocaleString("vi-VN")}đ/giờ
                    </div>
                    <button className="h-rc-btn" onClick={() => navigate(`/spaces/${room.roomId}`)}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Why Choose Us & CTA */}
      <section className="why-section">
        <div className="why-left">
          <h2>Vì sao chọn Smart Office Space?</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon"><i className="fa-regular fa-building"></i></div>
              <div className="stat-num">50+</div>
              <div className="stat-text">Không gian đa dạng</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
              <div className="stat-num">1.000+</div>
              <div className="stat-text">Khách hàng tin tưởng</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><i className="fa-regular fa-calendar-check"></i></div>
              <div className="stat-num">2.500+</div>
              <div className="stat-text">Lượt đặt phòng thành công</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><i className="fa-solid fa-star"></i></div>
              <div className="stat-num">4.8/5</div>
              <div className="stat-text">Đánh giá từ khách hàng</div>
            </div>
          </div>
        </div>

        <div className="why-right">
          <div className="cta-box">
            <h3>Doanh nghiệp của bạn cần<br />không gian làm việc?</h3>
            <p>Chúng tôi cung cấp giải pháp không gian linh hoạt, tiết kiệm chi phí và tối ưu hiệu quả cho doanh nghiệp.</p>
            <a href="/contact" className="cta-btn" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>
              Liên hệ tư vấn <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* 4. Features Bottom Bar */}
      <section className="features-bar">
        <div className="fb-item">
          <i className="fa-regular fa-circle-check"></i>
          <span>Đặt phòng nhanh chóng chỉ trong vài bước</span>
        </div>
        <div className="fb-item">
          <i className="fa-solid fa-box-open"></i>
          <span>Nhiều tiện ích hiện đại, đầy đủ</span>
        </div>
        <div className="fb-item">
          <i className="fa-solid fa-arrows-rotate"></i>
          <span>Không gian linh hoạt theo yêu cầu</span>
        </div>
        <div className="fb-item">
          <i className="fa-solid fa-user-tie"></i>
          <span>Hỗ trợ nhiệt tình chuyên nghiệp</span>
        </div>
      </section>
    </div>
  );
}
