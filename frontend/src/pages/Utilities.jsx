import React from 'react';
import './css/PublicPages.css';

const Utilities = () => {
    const utilities = [
        { icon: 'fa-snowflake', label: 'Máy lạnh', desc: 'Không gian luôn mát mẻ, thoải mái suốt ngày dài.' },
        { icon: 'fa-wifi', label: 'WIFI', desc: 'Kết nối internet tốc độ cao, ổn định và bảo mật.' },
        { icon: 'fa-chalkboard', label: 'Whiteboard', desc: 'Bảng trắng tiện lợi cho việc brainstorm và giảng dạy.' },
        { icon: 'fa-glass-water', label: 'Nước uống', desc: 'Nước lọc, nước uống miễn phí cho khách hàng.' },
        { icon: 'fa-tv', label: 'TV', desc: 'Màn hình lớn, sắc nét phục vụ thuyết trình và giải trí.' },
        { icon: 'fa-video', label: 'Máy chiếu', desc: 'Máy chiếu hiện đại, hỗ trợ trình chiếu chuyên nghiệp.' }
    ];

    return (
        <div className="public-page-container">
            
            <div className="utilities-grid">
                {utilities.map((item, index) => (
                    <div className="util-card" key={index}>
                        <div className="util-icon-wrapper">
                            <i className={`fa-solid ${item.icon}`}></i>
                            <span>{item.label}</span>
                        </div>
                        <div className="util-text">
                            <h4>{item.desc.split(',')[0]}...</h4>
                            <p>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Utilities;