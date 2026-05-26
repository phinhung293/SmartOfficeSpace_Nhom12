import React from 'react';
import './css/PublicPages.css';

const News = () => {
    const newsData = [
        {
            id: 1,
            img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
            date: '15/05/2026',
            category: 'Không gian làm việc',
            title: 'Xu hướng thiết kế không gian làm việc hiện đại 2026',
            desc: 'Khám phá những xu hướng thiết kế không gian làm việc hiện đại, tối ưu trải nghiệm và nâng cao hiệu suất làm việc.'
        },
        {
            id: 2,
            img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600',
            date: '15/05/2026',
            category: 'Không gian làm việc',
            title: 'Workshop: Nâng cao kỹ năng làm việc nhóm hiệu quả',
            desc: 'Tham gia workshop miễn phí tại Smart Office Space để học hỏi và thực hành các kỹ năng làm việc nhóm hiệu quả.'
        },
        {
            id: 3,
            img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600',
            date: '15/05/2026',
            category: 'Không gian làm việc',
            title: 'Lợi ích của việc làm việc trong không gian linh hoạt',
            desc: 'Không gian làm việc linh hoạt mang lại nhiều lợi ích cho doanh nghiệp và cá nhân. Tìm hiểu ngay!'
        }
    ];

    return (
        <div className="public-page-container">

            <h2 className="page-title">Tin tức & Sự kiện</h2>
            <p className="page-subtitle">Cập nhật những thông tin mới nhất về không gian làm việc, sự kiện và các xu hướng hiện đại.</p>

            <div className="news-grid">
                {newsData.map((news) => (
                    <div className="news-card" key={news.id}>
                        <div className="news-img-container">
                            <img src={news.img} alt={news.title} />
                            <div className="news-badges">
                                <span className="badge-date"><i className="fa-regular fa-calendar"></i> {news.date}</span>
                                <span className="badge-category">{news.category}</span>
                            </div>
                        </div>
                        <div className="news-content">
                            <h3>{news.title}</h3>
                            <p>{news.desc}</p>
                            <a href="#!">Xem tất cả &gt;&gt;</a>
                        </div>
                    </div>
                ))}
            </div>

            <a href="#!" className="btn-view-all">Xem tất cả tin tức</a>
        </div>
    );
};

export default News;