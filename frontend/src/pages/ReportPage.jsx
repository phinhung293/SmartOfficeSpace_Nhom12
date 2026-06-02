import React, { useState } from "react";
import "../pages/css/Report.css";
import ReportOverview   from "./ReportOverview";
import ReportRevenue    from "./ReportRevenue";
import ReportOccupancy  from "./ReportOccupancy";

const TABS = [
    { key: "overview",   label: "Tổng quan"  },
    { key: "revenue",    label: "Doanh thu"  },
    { key: "occupancy",  label: "Không gian" },
];

export default function ReportPage() {
    const [activeTab, setActiveTab] = useState("overview");

    const renderTab = () => {
        switch (activeTab) {
            case "overview":  return <ReportOverview />;
            case "revenue":   return <ReportRevenue />;
            case "occupancy": return <ReportOccupancy />;
            default:          return <ReportOverview />;
        }
    };

    return (
        <div className="report-page">
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                Trang chủ &gt; <span style={{ color: "#1a2e44", fontWeight: 600 }}>Báo cáo thống kê</span>
            </div>

            {/* Tab selector — dùng select như trong mockup */}
            <div className="report-controls" style={{ marginBottom: 24 }}>
                <select
                    className="report-select"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    style={{ minWidth: 180, fontSize: 15, fontWeight: 600 }}
                >
                    {TABS.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                </select>
            </div>

            {renderTab()}
        </div>
    );
}